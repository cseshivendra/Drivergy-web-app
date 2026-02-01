
import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.drivergy.app",
      "sha256_cert_fingerprints": [
        "01:92:19:66:96:C1:9E:E2:AE:34:E0:8A:8F:8C:2B:03:0D:BD:AD:C2:F4:D1:98:90:2D:15:4C:2A:FE:C0:75:F1"
      ]
    }
  }];

  return NextResponse.json(assetLinks);
}
