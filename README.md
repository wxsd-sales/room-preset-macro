# Room Presets Macro

This Webex Device macro lets you easily create room presets for your Webex Room series. It auto generates the presets as a list of buttons within a UI extension panel.

![image](https://user-images.githubusercontent.com/21026209/227252694-e9b32376-0db3-438f-b375-f391c85ec4ad.png)

## Overview

Easily create a Preset and specify all your display roles, matix, layouts and camera settings etc.

```js
{
  name: 'Local',          // Name for your preset
  displays: {
    outputRoles: ['Auto', 'Second', 'First'], // Output roles array
    matrix: [true, false, false],   // true = black screen | false = normal 
    monitorRole: 'DualPresentationOnly',  // The Video Monitor Role
    layout: 'Grid',         // Grid | Overlay | Stack | Focus
    osd: 2                  // The Video Output which will show the OSD
  },
  camera: {
    defaultSource: 3,       // Quadcam = 1, PTZ = 3
    speakerTrack: 'Off'     // Auto | Off
  }
}
```


## Setup

### Prerequisites & Dependencies: 

- RoomOS/CE 11.2.x or above Webex Device.
- Web admin access to the device to upload the macro.


### Installation Steps:
1. Download the ``room-preset.js`` file and upload it to your Webex Room device via Macro editor available on its web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.


## Validation

Validated Hardware:

* Room Kit Pro
* Should work for Roomkit Plus but you will need to change the display output config from three to two.

This macro should work on other Webex Devices but has not been validated at this time.

## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).


## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.


## Questions
Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=room-presets-macro) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team.
