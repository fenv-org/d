import 'package:freezed_annotation/freezed_annotation.dart';

part 'sample.freezed.dart';

@freezed
class Sample with _$Sample {
  const factory Sample({
    required String name,
    required int age,
  }) = _Sample;
}
