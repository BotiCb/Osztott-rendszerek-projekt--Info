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
        console.log(`Connection rejected (${client.id}): no userId provided`);
        client.emit('error', 'No userId provided');
        return client.disconnect(true);
      }

      // Prevent users who already voted from connecting as voters
      const hasVoted = await this.votingService.hasVoted(userId);
      if (hasVoted) {
        console.log(`User ${userId} already voted; rejecting connection for ${client.id}`);
        client.emit('error', 'You have already voted.');
        return client.disconnect(true);
      }

      this.voterConnections.add(client);
      console.log(`Voter connected: ${client.id} (user ${userId}). Total voters: ${this.voterConnections.size}`);

      if (this.voterConnections.size > MAX_CONNECTIONS) {
        console.log(
          `Max voters exceeded: ${this.voterConnections.size}/${MAX_CONNECTIONS}. Disconnecting voter ${client.id}`
        );
        client.emit('error', 'Maximum number of voters reached.');
        client.disconnect(true);
        return;
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
    const voterCount = this.voterConnections.size;
    console.log(`Broadcasting voter count: ${voterCount}`);
    // send to both voters and viewers
    [...this.voterConnections, ...this.viewerConnections].forEach((sock) =>
      sock.emit('connectionCount', { count: voterCount })
    );

    const counts = await this.votingService.getVoteCounts();
    console.log(`Broadcasting vote counts: ${JSON.stringify(counts)}`);
    // send to all
    [...this.voterConnections, ...this.viewerConnections].forEach((sock) => sock.emit('voteCounts', counts));
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

    // Map string keys to numeric codes
    let numericVote: number;
    if (typeof payload.voteValue === 'string') {
      switch (payload.voteValue) {
        case 'george-simion':
          numericVote = 1;
          break;
        case 'nicusor-dan':
          numericVote = 2;
          break;
        default:
          numericVote = parseInt(payload.voteValue, 10);
      }
    } else {
      numericVote = payload.voteValue;
    }
    console.log(`Mapped voteValue “${payload.voteValue}” → ${numericVote}`);

    try {
      const saved = await this.votingService.create(payload.userId, numericVote);
      console.log(`Vote saved:`, saved);
      client.emit('voteSuccess', saved);

      const counts = await this.votingService.getVoteCounts();
      console.log(`Updating everyone with new vote counts: ${JSON.stringify(counts)}`);
      [...this.voterConnections, ...this.viewerConnections].forEach((sock) => sock.emit('voteCounts', counts));
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
