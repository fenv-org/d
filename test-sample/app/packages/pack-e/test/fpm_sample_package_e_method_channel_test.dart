import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpm_sample_package_e/fpm_sample_package_e_method_channel.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  MethodChannelFpmSamplePackage_e platform = MethodChannelFpmSamplePackage_e();
  const MethodChannel channel = MethodChannel('fpm_sample_package_e');

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      channel,
      (MethodCall methodCall) async {
        return '42';
      },
    );
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, null);
  });

  test('getPlatformVersion', () async {
    expect(await platform.getPlatformVersion(), '42');
  });
}
