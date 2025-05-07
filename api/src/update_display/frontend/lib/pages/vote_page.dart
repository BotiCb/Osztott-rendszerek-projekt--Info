import 'package:flutter/material.dart';
import 'package:signalr_core/signalr_core.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class VotePage extends StatefulWidget {
  const VotePage({Key? key}) : super(key: key);

  @override
  State<VotePage> createState() => _VotePageState();
}

class _VotePageState extends State<VotePage> {
  final String apiUrl = 'http://localhost:5269/api/votes';
  final String hubUrl = 'http://localhost:5269/votehub';

  List<dynamic> votes = [];
  late HubConnection hubConnection;
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchVotes();
    _startSignalR();
  }

  Future<void> _fetchVotes() async {
    final response = await http.get(Uri.parse('$apiUrl/all'));
    if (response.statusCode == 200) {
      setState(() {
        votes = jsonDecode(response.body);
      });
    }
  }

  Future<void> _addVote(String text) async {
    final response = await http.post(
      Uri.parse('$apiUrl/add'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'text': text}),
    );
    if (response.statusCode == 200) {
      _controller.clear(); // Clear input field
    }
  }

  Future<void> _startSignalR() async {
    hubConnection = HubConnectionBuilder()
        .withUrl(hubUrl, HttpConnectionOptions(skipNegotiation: true, transport: HttpTransportType.webSockets))
        .build();

    hubConnection.on('NewVote', (args) {
      setState(() {
        votes.add(args![0]);
      });
    });

    hubConnection.on('VoteUpdated', (args) {
      final updatedVote = args![0];
      setState(() {
        final index = votes.indexWhere((v) => v['id'] == updatedVote['id']);
        if (index != -1) {
          votes[index] = updatedVote;
        }
      });
    });

    hubConnection.on('VoteDeleted', (args) {
      final id = args![0];
      setState(() {
        votes.removeWhere((v) => v['id'] == id);
      });
    });

    await hubConnection.start();
  }

  @override
  void dispose() {
    hubConnection.stop();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _deleteVote(int id) async {
    final response = await http.delete(Uri.parse('$apiUrl/delete/$id'));
    if (response.statusCode == 200) {
      // automatikus UI frissítés SignalR-en keresztül
    } else {
      throw Error();
    }
  }

  Future<void> _updateVote(int id, String text) async {
    final response = await http.put(
      Uri.parse('$apiUrl/update/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'id': id, 'text': text}),
    );
    if (response.statusCode == 200) {
      // automatikus UI frissítés SignalR-en keresztül
    } else {
      throw Error();
    }
  }

  void _showEditDialog(BuildContext context, Map<String, dynamic> vote) {
    final controller = TextEditingController(text: vote['text']);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Vote'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Vote text'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _updateVote(vote['id'], controller.text);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, int id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Vote'),
        content: const Text('Are you sure you want to delete this vote?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _deleteVote(id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Voting'),
        backgroundColor: Colors.deepPurple,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                labelText: 'New Vote',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: () {
                    if (_controller.text.trim().isNotEmpty) {
                      _addVote(_controller.text.trim());
                    }
                  },
                ),
              ),
              onSubmitted: (value) {
                if (value.trim().isNotEmpty) {
                  _addVote(value.trim());
                }
              },
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: votes.length,
                itemBuilder: (context, index) {
                  final vote = votes[index];
                  return Card(
                    elevation: 3,
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: ListTile(
                      title: Text(
                        vote['text'],
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () {
                              _showEditDialog(context, vote);
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () {
                              _confirmDelete(context, vote['id']);
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}