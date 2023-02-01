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
 * 
 * 
 ********************************************************/
import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  buttonName: 'Room Presets', // Name for button and page title
  presets: [        // Create your array of presets
    {
      name: 'Local Presenter',          // Name for your preset
      displays: {
        outputRoles: ['Auto', 'Second', 'First'], // Output roles array
        matrix: [true, false, false],   // true = black screen | false = normal 
        videoMonitors: 'DualPresentationOnly',  // More info here: https://roomos.cisco.com/xapi/Configuration.Video.Monitors
        layout: 'Grid',         // Grid | Overlay | Stack | Focus
        osd: 2                  // The Video Output which will show the OSD
      },
      camera: {
        inputSource: 2,       // Quadcam = 1, PTZ = 2
        speakerTrackBackground: 'Deactivate'     // Activate | Deactivate
      }
    },
    {
      name: 'Hybrid',
      displays: {
        outputRoles: ['First', 'Third', 'Second'],  //Auto, First, PresentationOnly, Recorder, Second, Third
        matrix: [false, false, false],
        videoMonitors: 'TriplePresentationOnly', //Auto, Dual, DualPresentationOnly, Single, Triple, TriplePresentationOnly
        layout: 'Stack',
        osd: 1
      },
      camera: {
        inputSource: 2,
        speakerTrackBackground: 'Deactivate'     // Activate | Deactivate
      }
    },
    {
      name: 'Remote Presenter',
      displays: {
        outputRoles: ['First', 'Third', 'Second'],
        matrix: [false, false, false],
        videoMonitors: 'TriplePresentationOnly',
        layout: 'Stack',
        osd: 1
      },
      camera: {
        inputSource: 1,
        speakerTrackBackground: 'Activate'     // Activate | Deactivate
      }
    }
  ]
}

/*********************************************************
 * Main function to setup and add event listeners
**********************************************************/

let currentLayout;

function main(){
  createPanel()
  xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidget);
  xapi.Status.Video.Layout.CurrentLayouts.AvailableLayouts.on(processLayouts)
}

setTimeout(main, 1000)



function processLayouts(layout){
  if(layout.ghost) return;
  // console.log('Layout Availablity Change');
  // console.log(`Current layout should be [${currentLayout}] available layout is: [${layout.LayoutName}]`);
  if (currentLayout == layout.LayoutName) {
    setLayout(currentLayout)
  }
}



function setCamera(camera) {
  console.log('Setting Main Video Source to: ' + camera.inputSource);
  xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camera.inputSource })
  .then(r=>{
    switch (camera.speakerTrackBackground) {
      case 'Activate':
      console.log(`Setting SpeakerTrack BackgroundMode to: [Activate]`);
      xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Activate()
      .catch(e=> console.error('Error Activating SpeakerTrack BackgroundMode: ' + e.message))
      break;
      case 'Deactivate':
      console.log(`Setting SpeakerTrack BackgroundMode to: [Deactivate]`);
      xapi.Command.Cameras.SpeakerTrack.BackgroundMode.Deactivate()
      .catch(e=> console.error('Error Deactivating SpeakerTrack BackgroundMode: ' + e.message))
      break;
    }
  })
  .catch(e=> console.error('Error setting Main video source: ' + e.message))
  
  
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
    if(state){
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
      { Value: (id == i) ? 'active' : 'inactive', WidgetId: 'display-preset-' + i });
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

async function setLayout(newLayout){
  console.log(`Attempting to set layout to: [${newLayout}]`)
  const current = await xapi.Status.Video.Layout.CurrentLayouts.ActiveLayout.get();
  if(current == newLayout) {
    console.log(`Layout [${newLayout}] is already set, ignoring`)
    return;
  }
  const available = await xapi.Status.Video.Layout.CurrentLayouts.AvailableLayouts.get();
  //console.log(available)
  for(let i=0; i<available.length; i++) {
    if(newLayout == available[i].LayoutName){
      console.log(`Layout [${newLayout}] is available, applying change`)
      xapi.Command.Video.Layout.SetLayout({ LayoutName: newLayout });
      return;
    }
  }
  console.log(`Layout ${newLayout} was not available to set`)
}

// Listen for clicks on the buttons
function processWidget(event) {
  if (event.Type !== 'clicked' || !event.WidgetId.startsWith("display-preset")) return;
  const presetNum = parseInt(event.WidgetId.slice(-1))
  const preset = config.presets[presetNum];
  console.log(`Display Preset '${preset.name}' selected`);
  console.log('Setting current layout to ' + preset.displays.layout);
  currentLayout = preset.displays.layout
  setWidgetActive(presetNum)
  setOSD(preset.displays.osd);
  setVideoMonitors(preset.displays.videoMonitors);
  setMatrix(preset.displays.matrix);
  setOutputRoles(preset.displays.outputRoles);
  setCamera(preset.camera);
  setLayout(currentLayout);
}

// Here we create the Button and Panel for the UI
async function createPanel() {
  let presets = '';
  config.presets.forEach((preset, i) => {
    const row = `
      <Row>
        <Options>size=3</Options>
        <Widget>
          <WidgetId>room-presets-${i}</WidgetId>
          <Type>Button</Type>
          <Name>${preset.name}</Name>
          <Options>size=4</Options>
        </Widget>
      </Row>`;
    presets = presets.concat(row);
  })
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
          ${presets}
          <Options>hideRowNames=1</Options>
        </Page>
      </Panel>
    </Extensions>`
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'room-presets' },
    panel
  )
}
