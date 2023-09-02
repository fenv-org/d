import 'package:flutter_test/flutter_test.dart';
import 'package:fpm_sample_package_e/fpm_sample_package_e.dart';
import 'package:fpm_sample_package_e/fpm_sample_package_e_platform_interface.dart';
import 'package:fpm_sample_package_e/fpm_sample_package_e_method_channel.dart';
import 'package:plugin_platform_interface/plugin_platform_interface.dart';

class MockFpmSamplePackage_ePlatform
    with MockPlatformInterfaceMixin
    implements FpmSamplePackage_ePlatform {

  @override
  Future<String?> getPlatformVersion() => Future.value('42');
}

void main() {
  final FpmSamplePackage_ePlatform initialPlatform = FpmSamplePackage_ePlatform.instance;

  test('$MethodChannelFpmSamplePackage_e is the default instance', () {
    expect(initialPlatform, isInstanceOf<MethodChannelFpmSamplePackage_e>());
  });

  test('getPlatformVersion', () async {
    FpmSamplePackage_e fpmSamplePackage_ePlugin = FpmSamplePackage_e();
    MockFpmSamplePackage_ePlatform fakePlatform = MockFpmSamplePackage_ePlatform();
    FpmSamplePackage_ePlatform.instance = fakePlatform;

    expect(await fpmSamplePackage_ePlugin.getPlatformVersion(), '42');
  });
}
