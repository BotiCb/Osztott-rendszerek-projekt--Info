// src/voting/voting.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VotingService } from './voting.service';

const MAX_CONNECTIONS = 10;
// Map numeric vote codes → your candidate keys
const CODE_TO_KEY: Record<number, string> = {
  1: 'george-simion',
  2: 'nicusor-dan',
};

@WebSocketGateway({ path: '/ws/voting', cors: true })
export class VotingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private voterConnections = new Set<Socket>();
  private viewerConnections = new Set<Socket>();

  constructor(private readonly votingService: VotingService) {}

  async handleConnection(client: Socket) {
    const { role = 'voter', userId: uid } = client.handshake.query;
    const userId = parseInt(uid as string, 10);

    if (role === 'viewer') {
      this.viewerConnections.add(client);
      console.log(`Viewer connected: ${client.id}. Total viewers: ${this.viewerConnections.size}`);
    } else {
      if (isNaN(userId)) {
        client.emit('error', 'No userId provided');
        return client.disconnect(true);
      }
      if (await this.votingService.hasVoted(userId)) {
        client.emit('error', 'You have already voted.');
        return client.disconnect(true);
      }
      this.voterConnections.add(client);
      console.log(`Voter connected: ${client.id} (user ${userId}). Total voters: ${this.voterConnections.size}`);
      if (this.voterConnections.size > MAX_CONNECTIONS) {
        client.emit('error', 'Maximum number of voters reached.');
        return client.disconnect(true);
      }
    }

    await this.broadcastState();
  }

  handleDisconnect(client: Socket) {
    if (this.voterConnections.delete(client)) {
      console.log(`Voter disconnected: ${client.id}. Total voters: ${this.voterConnections.size}`);
    }
    if (this.viewerConnections.delete(client)) {
      console.log(`Viewer disconnected: ${client.id}. Total viewers: ${this.viewerConnections.size}`);
    }
    this.broadcastState();
  }

  private async broadcastState() {
    // 1) Broadcast connection count to everyone
    const voterCount = this.voterConnections.size;
    console.log(`Broadcasting voter count: ${voterCount}`);
    [...this.voterConnections, ...this.viewerConnections].forEach((sock) =>
      sock.emit('connectionCount', { count: voterCount })
    );

    // 2) Fetch raw counts (numeric keys) then remap to candidate keys
    const raw: Record<number, number> = await this.votingService.getVoteCounts();
    const namedCounts: Record<string, number> = {};
    for (const [codeStr, count] of Object.entries(raw)) {
      const code = parseInt(codeStr, 10);
      const key = CODE_TO_KEY[code];
      if (!key) continue; // skip any unmapped codes (e.g. -1)
      namedCounts[key] = count;
    }
    console.log(`Broadcasting vote counts: ${JSON.stringify(namedCounts)}`);
    [...this.voterConnections, ...this.viewerConnections].forEach((sock) => sock.emit('voteCounts', namedCounts));

    // 3) Broadcast full voter list
    const votes = await this.votingService.findAll(); // includes user relation
    const voterList = votes.map((v) => ({
      userId: v.user.id,
      username: v.user.username,
    }));
    console.log(`Broadcasting voterList:`, voterList);
    [...this.voterConnections, ...this.viewerConnections].forEach((sock) => sock.emit('voterList', voterList));
  }

  @SubscribeMessage('castVote')
  async handleCastVote(
    @MessageBody() payload: { userId: number; voteValue: string | number },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`Received castVote from ${client.id}:`, payload);

    if (!this.voterConnections.has(client)) {
      console.log(`Rejected vote from ${client.id}: not a registered voter`);
      return client.emit('error', 'You must be a connected voter to vote.');
    }

    // Map string voteValue → numeric code
    let numericVote: number;
    if (typeof payload.voteValue === 'string') {
      numericVote =
        (Object.entries(CODE_TO_KEY).find(([, key]) => key === payload.voteValue)?.[0] as unknown as number) ||
        parseInt(payload.voteValue, 10);
    } else {
      numericVote = payload.voteValue;
    }
    console.log(`Mapped voteValue “${payload.voteValue}” → ${numericVote}`);

    try {
      const saved = await this.votingService.create(payload.userId, numericVote);
      console.log(`Vote saved:`, saved);
      client.emit('voteSuccess', saved);

      // Refresh everybody’s data
      await this.broadcastState();
    } catch (err: any) {
      if (err.status === 409) {
        console.log(`Conflict for ${client.id}: ${err.message}`);
        client.emit('error', 'You have already voted.');
      } else {
        console.error(`Error saving vote for ${client.id}:`, err);
        client.emit('error', err.message || 'Failed to save vote.');
      }
    }
  }
}
