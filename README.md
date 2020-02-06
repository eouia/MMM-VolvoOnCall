# MMM-VolvoOnCall
MM plugin for Volvo car status with VOC

## Screenshot
![](https://raw.githubusercontent.com/eouia/MMM-VolvoOnCall/master/voc.png)

## Notice
- This module use unofficial and not-well-supported methods to retrieve sensitive informations of the car.
- I have no legal right or duty for data and module's working. All responsibility of using is on yours.
- This module may not work at anytime without any notice.
- For safety, I will not implement any remote-controllable features on this module.(like heater on, engine start, door unlock, or anything)
- I have only one vehicle to test, so test might be not enough. There could be possibility of bugs on having more than one car, and locale issue by language or location.

## Installation
### 0. VolvoOnCall
Of course, you have to be an active member of `Volvo on Call` service, and your car and your account should be linked without issue.

### 1. Dependency
This module is just a wrapper of @molobrakos 's `volvooncall` python program for MagicMirror.
So, you should install https://github.com/molobrakos/volvooncall first.

1. You need Python3(3.6) or higher
```sh
#Check your current python version
python --version
#Or
python3 --version
```
If you have no python3 or lower than 3.6, install python 3.6 or higher.
- https://installvirtual.com/install-python-3-on-raspberry-pi-raspbian/


2. Install `molobrakos/volvooncall`
```sh
cd ~
git clone https://github.com/molobrakos/volvooncall.git
cd volvooncall
python setup.py install      # or use `python3`
```

3. Test
```sh
nano ~/.voc.conf
```
Then write belows then save it.
```
username: <your VOC id. usually email address>
password: <your VOC password>
```
Then test this.
```sh
voc list
```
It should show something similar like this. (Your Car Id(Usually car plate, but might be different), type, VIN)
```
ABCD1234 (V90/2020) TU1VW23XYZ4567890
```
If not working, just sorry.

### 3. Get Google Map API Key.
Don't worry, it's free.
https://developers.google.com/maps/documentation/javascript/get-api-key

### 4. Install module
```sh
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-VolvoOnCall
cd MMM-VolvoOnCall
npm install
```

## Configuration
### Simple
```js
{
  module: "MMM-VolvoOnCall",
  position: "top_right",
  config: {
    units: "us", // "us", "imperial", "metric", "kr" could be available.
    mapConfig: {
      apiKey: "AXzaSyDyiW04hjBbQ1234i5gOYcdxG9h4fVPR123",  // Your Google Map API Key
    }
  }
},
```

### Default and Details
> You don't need to use all of these values. All these values are defined as default.
Just pick what you need and describe in configuration like above `Simple` version.

```js
config: {
  scanInterval: 1000 * 60 * 30, // How often to retrieve VOC data
  refreshInterval: 1000 * 60 * 10,  // If you have several cars on your account, Cars will be rotated per this interval.
  // per scanInterval, automatically module will be updated, so, if you have only one car, leave this enough long.
  units: "kr", // "metric", "us", "imperial", "kr" could be available
  timestampFormat: "MMM D. HH:mm:ss",
  durationFormat: "HH:mm",
  iconify: "https://code.iconify.design/1/1.0.4/iconify.min.js", // if you are using other module which has `iconfy` already together, set this to null
  mapConfig: {
    width: "100%",
    height: "300px",
    zoom: 15, // 0-20, I think the value around 15 will be the best.
    apiKey: ""
  },
  display: { // You can control which section will be displayed or not.
    info: true,
    position: true,
    status: true,
    notice: true,
    trip: true,
  },
  icons: { // You can assign another iconify icon or your own image file or text or...
    "Car": `<span class="iconify" data-icon="ant-design:car-twotone"></span> `,
    "Fuel amount": `<span class="iconify" data-icon="mdi:fuel"></span> `,
    "Fuel level": `<span class="iconify" data-icon="mdi:water-percent"></span> `,
    "Range": `<span class="iconify" data-icon="maki:fuel-11"></span> `,
    "Fuel consumption": `<span class="iconify" data-icon="oi:graph"></span> `,
    "Average speed": `<span class="iconify" data-icon="cil:speedometer"></span> `,
    "Odometer": `<span class="iconify" data-icon="vaadin:road"></span> `,
    "Departure": `<span class="iconify" data-icon="mdi:car-side"></span> `,
    "Arrival": `<span class="iconify" data-icon="icons8:finish-flag"></span> `,
    "Duration": `<span class="iconify" data-icon="bx:bx-time-five"></span>`,
    "Distance": `<span class="iconify" data-icon="mdi:map-marker-distance"></span>`,
  }
},
```
