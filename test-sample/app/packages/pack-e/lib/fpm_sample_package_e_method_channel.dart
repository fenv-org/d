import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'fpm_sample_package_e_platform_interface.dart';

/// An implementation of [FpmSamplePackage_ePlatform] that uses method channels.
class MethodChannelFpmSamplePackage_e extends FpmSamplePackage_ePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('fpm_sample_package_e');

  @override
  Future<String?> getPlatformVersion() async {
    final version = await methodChannel.invokeMethod<String>('getPlatformVersion');
    return version;
  }
}
