/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-1
 * Released: 01/10/23
 * 
 * This macro lets you easily create and switch between room presets
 * 
 * More information available here:
 * https://github.com/wxsd-sales/room-presets-macro
 * 
 ********************************************************/
import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  buttonName: 'Room Presets', // Name for button and page title
  footNote: '🔳 = Off | 🟩 = Presentation | 🔲 = Video',
  presets: [        // Create your array of presets
    {
      name: 'Local Presenter',          // Name for your preset
      guide: '🔳🟩🔲',
      displays: {
        outputRoles: ['Auto', 'Second', 'First'], // Output roles array
        matrix: [true, false, false],   // true = black screen | false = normal 
        videoMonitors: 'DualPresentationOnly',  // More info here: https://roomos.cisco.com/xapi/Configuration.Video.Monitors
        layout: 'Grid',         // Grid | Overlay | Stack | Focus
        osd: 1                 // The Video Output which will show the OSD
      },
      camera: {
        inputSource: 3,       // Camera 1 | 2 | 3
        speakerTrackBackground: 'Deactivate',     // Activate | Deactivate
        showPresets: true,
        defaultPreset: 2   // default to 2 = Entire Stage
      }
    },
    {
      name: 'Hybrid',
      guide: '🔲🟩🔲',
      displays: {
        outputRoles: ['First', 'Third', 'Second'],  //Auto, First, PresentationOnly, Recorder, Second, Third
        matrix: [false, false, false],
        videoMonitors: 'TriplePresentationOnly', //Auto, Dual, DualPresentationOnly, Single, Triple, TriplePresentationOnly
        layout: 'Stack',
        osd: 1
      },
      camera: {
        inputSource: 3,
        speakerTrackBackground: 'Deactivate',     // Activate | Deactivate
        showPresets: true,
        defaultPreset: 2   // default to 2 = Entire Stage
      }
    },
    {
      name: 'Remote Presenter',
      guide: '🔲🔲🟩',
      displays: {
        outputRoles: ['First', 'Third', 'Second'],
        matrix: [false, false, false],
        videoMonitors: 'TriplePresentationOnly',
        layout: 'Stack',
        osd: 1
      },
      camera: {
        inputSource: 1,
        speakerTrackBackground: 'Deactivate'     // Activate | Deactivate (Setting to Deactivate for the time being)
      }
    }
  ]
}

/*********************************************************
 * Main function to setup and add event listeners
**********************************************************/

let currentLayout;

let activeCameraPreset;

function main() {
  createPanel()
  xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidgets);
  xapi.Status.Video.Layout.CurrentLayouts.AvailableLayouts.on(processLayouts)

}

setTimeout(main, 1000)

function processLayouts(layout) {
  if (layout.ghost) return;
  if (currentLayout == layout.LayoutName) {
    setLayout(currentLayout)
  }
}

function setCamera(camera) {
  console.log('Setting Main Video Source to: ' + camera.inputSource);

  switch (camera.speakerTrackBackground) {
    case 'Activate':
      console.log(`Setting SpeakerTrack BackgroundMode to: [Activate]`);
      xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camera.inputSource })
      .then(r=>{
        xapi.Command.Cameras.SpeakerTrack.Activate()
        .catch(e => console.error('Error Activating SpeakerTrack: ' + e.message))
        xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Activate()
        .catch(e => console.error('Error Activating SpeakerTrack BackgroundMode: ' + e.message))
      })
      .catch(e => console.error('Error Setting MainVideoSource: ' + e.message))

      break;
    case 'Deactivate':
      console.log(`Setting SpeakerTrack BackgroundMode to: [Deactivate]`);
      xapi.Command.Cameras.SpeakerTrack.Deactivate()
        .then(r => {
          xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camera.inputSource })
          if (camera.defaultPreset) {
            activateCameraPreset(camera.defaultPreset)
          }
        })
      break;
  }

}

function activateCameraPreset(id) {
  console.log(`Activating Camera Preset [${id}] `)
  xapi.Command.Camera.Preset.Activate(
    { PresetId: id });
}

function setOSD(id) {
  console.log('Setting OSD to Output: ' + id)
  xapi.Config.UserInterface.OSD.Output.set(id);
}


// Sets the Video Monitors for the devices:
// https://roomos.cisco.com/xapi/Configuration.Video.Monitors
function setVideoMonitors(mode) {
  console.log('Setting Monitors Role to: ' + mode)
  xapi.Config.Video.Monitors.set(mode)
    .catch(e => 'Failed to set Video Monitors Role: ' + e.message)
}

function setOutputRoles(roles) {
  roles.forEach((role, index) => {
    const id = index + 1;
    console.log(`Setting Video Output [${id}] Role to: ${role}`)
    xapi.Config.Video.Output.Connector[id].MonitorRole.set(role)
      .catch(e => console.error(`Could not set Output [${id}] to ${role}: ${e.message}`))
  })
}

function setMatrix(displays) {
  displays.forEach((state, index) => {
    const id = index + 1;
    console.log(`Setting Video Matrix Output [${id}] to: ${state ? 'On' : 'Off'}`)
    if (state) {
      xapi.Command.Video.Matrix.Assign({ Output: id })
        .catch(e => console.error(`Could not Assign Matrix to [${id}]: ${e.message}`))
    } else {
      xapi.Command.Video.Matrix.Reset({ Output: id })
        .catch(e => console.error(`Could not Reset Matrix to [${id}]: ${e.message}`))
    }
  })
}

function setWidgetActive(id) {
  config.presets.forEach((preset, i) => {
    xapi.Command.UserInterface.Extensions.Widget.SetValue(
      { Value: (id == i) ? 'active' : 'inactive', WidgetId: 'room-preset' + i });
  })
}

// Identify the currect state of the device and which 
// configured preset matches and update the UI accordingly 
async function identifyState() {
  console.log('Syncing UI')
  const outputs = await xapi.Config.Video.Output.Connector.get()

  const displays = {
    outputRoles: outputs.map(output => output.MonitorRole),
    monitorRole: await xapi.Config.Video.Monitors.get(),
    osd: parseInt(await xapi.Status.UserInterface.OSD.Output.get())
  }

  const camera = {
    defaultSource: 1,   // Quadcam
    speakerTrack: await xapi.Config.Cameras.SpeakerTrack.Mode.get()
  }

  console.log('Checking Presets')
  config.presets.forEach((preset, i) => {
    if (JSON.stringify(preset.displays) != JSON.stringify(displays)) return;
    if (JSON.stringify(preset.camera) != JSON.stringify(camera)) return;
    console.log(`Preset '${preset.name}' is configured, updating UI`);
    setWidgetActive(i)
  })
}

async function setLayout(newLayout) {
  console.log(`Attempting to set layout to: [${newLayout}]`)
  const current = await xapi.Status.Video.Layout.CurrentLayouts.ActiveLayout.get();
  if (current == newLayout) {
    console.log(`Layout [${newLayout}] is already set, ignoring`)
    return;
  }
  const available = await xapi.Status.Video.Layout.CurrentLayouts.AvailableLayouts.get();
  //console.log(available)
  for (let i = 0; i < available.length; i++) {
    if (newLayout == available[i].LayoutName) {
      console.log(`Layout [${newLayout}] is available, applying change`)
      xapi.Command.Video.Layout.SetLayout({ LayoutName: newLayout });
      return;
    }
  }
  console.log(`Layout ${newLayout} was not available to set`)
}

// Listen for clicks on the buttons
function processWidgets(event) {
  if (event.WidgetId.startsWith("room-preset")) {
    if (event.Type !== 'clicked') return;
    const presetNum = parseInt(event.WidgetId.slice(-1))
    const preset = config.presets[presetNum];
    setWidgetActive(presetNum);
    applyRoomPreset(preset);
    createPanel(presetNum);
  }

  if (event.WidgetId == 'room-camera-presets') {
    if (event.Type !== 'pressed') return;
    console.log(event)
    console.log(`Camera Presets Pressed, id [${event.Value}]`);
    activateCameraPreset(event.Value);
  }
}

function applyRoomPreset(preset) {
  console.log(`Display Preset [${preset.name}] selected`);
  console.log('Setting current layout to ' + preset.displays.layout);
  setCamera(preset.camera);
  currentLayout = preset.displays.layout
  //setOSD(preset.displays.osd);
  setOutputRoles(preset.displays.outputRoles);
  setTimeout(setVideoMonitors, 1000, preset.displays.videoMonitors);
  setTimeout(setMatrix,1000,preset.displays.matrix);
  setTimeout(setLayout,1000,currentLayout);
}

// Here we create the Button and Panel for the UI
async function createPanel(active) {
  let presets = '';
  config.presets.forEach((preset, i) => {
    let widgets = `
        <Widget>
          <WidgetId>room-preset${i}</WidgetId>
          <Type>Button</Type>
          <Name>${preset.name}</Name>
          <Options>size=2</Options>
        </Widget>`;
    if (preset.guide) {
      const guide = `
        <Widget>
          <WidgetId>room-guide${i}</WidgetId>
          <Name>${preset.guide}</Name>
          <Type>Text</Type>
          <Options>size=1;fontSize=normal;align=center</Options>
        </Widget>`;
      widgets = widgets.concat(guide)
    }
    presets = presets.concat(`<Row>${widgets}</Row>`);
  })
  let banner = ''
  let footNote = ''
  if (config.footNote) {
    banner = `
        <Row>
          <Widget>
            <WidgetId>room-banner-presets</WidgetId>
            <Name>Preset</Name>
            <Type>Text</Type>
            <Options>size=2;fontSize=normal;align=center</Options>
          </Widget>
          <Widget>
            <WidgetId>room-banner-displays</WidgetId>
            <Name>Displays</Name>
            <Type>Text</Type>
            <Options>size=1;fontSize=normal;align=center</Options>
          </Widget>
        </Row>`;

    footNote = `
      <Row>
        <Widget>
          <WidgetId>room-footNote</WidgetId>
          <Name>${config.footNote}</Name>
          <Type>Text</Type>
          <Options>size=4;fontSize=small;align=center</Options>
        </Widget>
      </Row>`;
  }

  console.log('Active = ' + active)

  const activePresetCamera = typeof active != 'undefined' ? config.presets[active].camera : false

  console.log(activePresetCamera)
  const showPresets = activePresetCamera.showPresets;
  const inputSource = activePresetCamera.inputSource;

  const cameraPresetList = await xapi.Command.Camera.Preset.List({ CameraId: inputSource })
  // console.log('CameraPreset List: ' + cameraPresetList)
  // console.log('ShowPresets: ' + showPresets)
  // console.log('inputSource: ' + inputSource)

  let cameraPresets = '';
  if (showPresets && cameraPresetList.Preset) {
    let values = ''
    cameraPresetList.Preset.forEach(preset => {
      const value = `
        <Value>
          <Key>${preset.id}</Key>
          <Name>${preset.Name}</Name>
        </Value>`;
      values = values.concat(value)
    })

    cameraPresets = `
      <Row>
        <Widget>
          <WidgetId>room-camera-presets</WidgetId>
          <Type>GroupButton</Type>
          <Options>size=3</Options>
          <ValueSpace>
          ${values}
          </ValueSpace>
        </Widget>
      </Row>`;
  }

  const panel = `
    <Extensions>
      <Panel>
        <Type>Statusbar</Type>
        <Location>HomeScreenAndCallControls</Location>
        <Icon>Tv</Icon>
        <Name>${config.buttonName}</Name>
        <ActivityType>Custom</ActivityType>
        <Page>
          <Name>${config.buttonName}</Name>
          ${banner}
          ${presets}
          ${footNote}
          ${cameraPresets}
          <Options>hideRowNames=1</Options>
        </Page>
      </Panel>
    </Extensions>`
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'room-presets' },
    panel
  )
    .then(r => {


    })
}
