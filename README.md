# Room Presets Macro

This Webex Device macro lets you easily create room presets for your Webex Room series. It auto generates the presets as a list of button within a UI extension panel.

![download (9)](https://user-images.githubusercontent.com/21026209/214661392-7156db8a-ccac-4a92-ae29-fc62d8f32a69.png)


Easily create a Preset and specify all your display roles, matix, layouts and camera settings etc.

```yaml
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

## Requirements

1. RoomOS/CE 11.2.x or above Webex Device.
2. Web admin access to the device to uplaod the macro.

## Setup

1. Download the ``room-control.js`` and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
3. Enable the Macro on the editor.

## Validation

Validated Hardware:

* Room Kit Pro
* Could work for roomkit plus but you will need to change the display output config from 3 - 2

This macro should work on other Webex Devices but has not been validated at this time.

## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=room-presets-macro)
