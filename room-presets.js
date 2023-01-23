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
 * Version: 1-0-0
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
  buttoName: 'Presentation Mode', // Name for button and page title
  presets: [        // Create your array of presets
    {
      name: 'Local',          // Name for your preset
      displays: {
        outputRoles: ['Off', 'Auto', 'PresentationOnly'], // Output roles array
        monitorRole: 'Auto',    // The Video Monitor Role
        osd: 2                  // THe Video Output which will show the OSD
      },
      camera: {
        defaultSource: 1,       // Quadcam = 1, PTZ = 2
        speakerTrack: 'Off'     // Auto | Off
      }
    },
    {
      name: 'Hybrid',
      displays: {
        outputRoles: ['Auto', 'Auto', 'PresentationOnly'],
        monitorRole: 'Auto',
        osd: 1
      },
      camera: {
        defaultSource: 1,
        speakerTrack: 'Off'
      }
    },
    {
      name: 'Remote',
      displays: {
        outputRoles: ['Auto', 'Auto', 'PresentationOnly'],
        monitorRole: 'Auto',
        osd: 1
      },
      camera: {
        defaultSource: 1,
        speakerTrack: 'Off'
      }
    },
    {
      name: 'Remote Option 2',
      displays: {
        outputRoles: ['Auto', 'Auto', 'PresentationOnly'],
        monitorRole: 'Auto',
        osd: 1
      },
      camera: {
        defaultSource: 1,
        speakerTrack: 'Off'
      }
    }
  ]
}

/*********************************************************
 * Main function to setup and add event listeners
**********************************************************/

function setCamera(camera) {
  console.log(`Setting SpeakerTrack to: ${camera.speakerTrack}`);
  xapi.Config.Cameras.SpeakerTrack.Mode.set(camera.speakerTrack);
  console.log('Setting Main Video Source to: ' + camera.defaultSource);
  xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camera.defaultSource });
}

function setOSD(id) {
  console.log('Setting OSD to Output: ' + id)
  xapi.Config.UserInterface.OSD.Output.set(id);
}

function setMonitorRole(mode) {
  console.log('Setting Monitors Role to: ' + mode)
  xapi.Config.Video.Monitors.set(mode)
    .catch(e => 'Failed to set Video Monitors Role: ' + e.message)
}

function setOutputRoles(roles) {
  roles.forEach((role, index) => {
    const id = index + 1;
    console.log(`Setting Video Output [${id}] Role to: ${role}`)
    if (role == 'Off') {
      xapi.Command.Video.Matrix.Assign({ Output: id })
        .catch(e => `Could not Assign Matrix to [${id}]: ${e.message}`)
    } else {
      xapi.Command.Video.Matrix.Reset({ Output: id })
        .catch(e => `Could not Reset Matrix to [${id}]: ${e.message}`)
      xapi.Config.Video.Output.Connector[id].MonitorRole.set(role)
        .catch(e => `Could not set Output [${id}] to ${role}: ${e.message}`)
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

// Listen for clicks on the buttons
function processWidget(event) {
  if (event.Type !== 'clicked' || !event.WidgetId.startsWith("display-preset")) return;
  const presetNum = parseInt(event.WidgetId.slice(-1))
  const preset = config.presets[presetNum];
  console.log(`Display Preset '${preset.name}' selected`)
  setWidgetActive(presetNum)
  setOSD(preset.displays.osd);
  setMonitorRole(preset.displays.monitorRole);
  setOutputRoles(preset.displays.outputRoles);
  setCamera(preset.camera)
}

// Here we create the Button and Panel for the UI
async function createPanel() {
  let presets = '';
  config.presets.forEach((preset, i) => {
    const row = `
      <Row>
        <Options>size=3</Options>
        <Widget>
          <WidgetId>display-preset-${i}</WidgetId>
          <Type>Button</Type>
          <Name>${preset.name}</Name>
          <Options>size=4</Options>
        </Widget>
      </Row>`;
    presets = presets.concat(row);
  })
  const panel = `
    <Extensions>
      <Version>1.9</Version>
      <Panel>
        <Type>Statusbar</Type>
        <Location>HomeScreenAndCallControls</Location>
        <Icon>Tv</Icon>
        <Name>${config.buttoName}</Name>
        <ActivityType>Custom</ActivityType>
        <Page>
          <Name>${config.buttoName}</Name>
          ${presets}
          <Options>hideRowNames=1</Options>
        </Page>
      </Panel>
    </Extensions>`
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'display-controls' },
    panel
  ).then(identifyState)
}

createPanel()
xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidget);
