import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'fpm_sample_package_e_method_channel.dart';

abstract class FpmSamplePackage_ePlatform extends PlatformInterface {
  /// Constructs a FpmSamplePackage_ePlatform.
  FpmSamplePackage_ePlatform() : super(token: _token);

  static final Object _token = Object();

  static FpmSamplePackage_ePlatform _instance = MethodChannelFpmSamplePackage_e();

  /// The default instance of [FpmSamplePackage_ePlatform] to use.
  ///
  /// Defaults to [MethodChannelFpmSamplePackage_e].
  static FpmSamplePackage_ePlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [FpmSamplePackage_ePlatform] when
  /// they register themselves.
  static set instance(FpmSamplePackage_ePlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  Future<String?> getPlatformVersion() {
    throw UnimplementedError('platformVersion() has not been implemented.');
  }
}
