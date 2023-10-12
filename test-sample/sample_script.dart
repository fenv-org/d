import 'dart:io';

void main(List<String> arguments) {
  final f = File(arguments[1]);
  f.writeAsStringSync(arguments[0] + '\n');
}
