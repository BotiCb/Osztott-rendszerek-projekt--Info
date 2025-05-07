import 'package:signalr_core/signalr_core.dart';

class SignalRService {
  late HubConnection connection;

  Future<void> start(Function(dynamic) onNewVote) async {
    connection = HubConnectionBuilder()
        .withUrl('http://localhost:5269/votehub') // Match your .NET Hub route
        .withAutomaticReconnect()
        .build();

    connection.on('NewVote', (data) {
      onNewVote(data![0]); // Handle incoming vote
    });

    await connection.start();
    print('SignalR connected');
  }

  void stop() {
    connection.stop();
  }
}