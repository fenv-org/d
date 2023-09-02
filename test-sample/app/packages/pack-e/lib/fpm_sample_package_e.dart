
import 'fpm_sample_package_e_platform_interface.dart';

class FpmSamplePackage_e {
  Future<String?> getPlatformVersion() {
    return FpmSamplePackage_ePlatform.instance.getPlatformVersion();
  }
}
