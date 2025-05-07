class Vote {
  final int id;
  final String text;

  Vote({required this.id, required this.text});

  factory Vote.fromJson(Map<String, dynamic> json) {
    return Vote(
      id: json['id'],
      text: json['text'],
    );
  }
}