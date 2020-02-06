Module.register("MMM-VolvoOnCall", {
  defaults: {
    debug: false,
    scanInterval: 1000 * 60 * 30,
    refreshInterval: 1000 * 60 * 1,
    units: "kr", // "metric", "us", "imperial", "kr" could be available
    timestampFormat: "MMM D. HH:mm:ss",
    durationFormat: "HH:mm",
    iconify: "https://code.iconify.design/1/1.0.4/iconify.min.js", // if you are using other module which has `iconfy` already, set this to "null"
    mapConfig: {
      width: "100%",
      height: "300px",
      zoom: 15,
      apiKey: ""
    },
    display: {
      info: true,
      position: true,
      status: true,
      notice: true,
      trip: true,
    },
    icons: {
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
  getScripts: function() {
    var r = ["moment.js"]
    if (this.config.iconify) r.push(this.config.iconify)
    return r
  },

  getStyles: function() {
    return ["MMM-VolvoOnCall.css"]
  },

  configAssignment : function (result) {
    var stack = Array.prototype.slice.call(arguments, 1)
    var item
    var key
    while (stack.length) {
      item = stack.shift()
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (
            typeof result[key] === "object" && result[key]
            && Object.prototype.toString.call(result[key]) !== "[object Array]"
          ) {
            if (typeof item[key] === "object" && item[key] !== null) {
              result[key] = this.configAssignment({}, result[key], item[key])
            } else {
              result[key] = item[key]
            }
          } else {
            result[key] = item[key]
          }
        }
      }
    }
    return result
  },

  start: function() {
    this.config = this.configAssignment({}, this.defaults, this.config)
    this.poll = null
    this.result = []
    this.cycle = null
    this.index = 0
    this.carInfo = []
    this.trips = {}
  },

  convertData: function(rawArray) {
    var ret = {}
    for(var i = 0; i < rawArray.length; i++) {
      ret[rawArray[i].key] = rawArray[i].value
    }
    return ret
  },

  units: function(type, from) {
    if (type == "L") {
      if (this.config.units == "us" || this.config.units == "imperial") {
        return Math.round(from * 0.264172) + " gl"
      } else {
        return from + " L"
      }
    }
    if (type == "KM") {
      if (this.config.units == "us" || this.config.units == "imperial") {
        return Math.round(from * 0.621371) + " mi"
      } else {
        return from + " km"
      }
    }
    if (type == "KMH") {
      if (this.config.units == "us" || this.config.units == "imperial") {
        return Math.round(from * 0.621371) + " mph"
      } else {
        return Math.round(from) + " km/h"
      }
    }

    if (type == "LPKM") {
      if (this.config.units == "us" || this.config.units == "imperial") {
        return Math.round(235.215 / from) + " mpg"
      } else if (this.config.units == "kr") {
        return (Math.round(100 / from * 10) / 10) + " km/l"
      } else {
        return (Math.round(from * 10) / 10) + ` L / 100 km`
      }
    }
    return false
  },

  getDom: function() {
    var createElement = (elType="div", classList=[], name="", innerHTML="") => {
      var dom = document.createElement(elType)
      if (this.config.icons.hasOwnProperty(name)) innerHTML = this.config.icons[name] + innerHTML
      if (innerHTML) dom.innerHTML = innerHTML
      for (var i = 0; i < classList.length; i++) {
        dom.classList.add(classList[i])
      }
      return dom
    }
    var dom = document.createElement("div")
    dom.classList.add("VOC")
    if (this.result.length == 0) return dom
    var carId = this.carInfo[this.index].id
    var data = this.convertData(this.result[this.index])
    if (this.config.display.info) {
      var car = this.carInfo[this.index]
      var sec = createElement("div", ["section", "info"])
      var content = createElement("div", ["content"])
      var info = createElement("div", ["item", "name"], "Car", `${car.id} (${car.type})`)
      sec.appendChild(info)
      dom.appendChild(sec)
    }
    if (this.config.display.position && data.hasOwnProperty("Position")) {
      var position = data["Position"]
      var sec = createElement("div", ["position", "section"])
      var map = createElement("iframe", ["map","content"])
      map.style.width = this.config.mapConfig.width
      map.style.height = this.config.mapConfig.height
      map.frameborder = 0
      map.style.border = 0
      map.src = `https://www.google.com/maps/embed/v1/place?q=${position.lat},${position.long}&zoom=${this.config.mapConfig.zoom}&key=${this.config.mapConfig.apiKey}`
      sec.appendChild(map)
      dom.appendChild(sec)
    }
    if (this.config.display.status) {
      var sec = createElement("div", ["status", "section"])
      var content = createElement("div", ["content"])
      var bar = createElement("div", ["bar", "amount", "item"], "Fuel amount", this.units("L", data["Fuel amount"]))
      var barG = createElement("div", ["level", "item", "guage",], "Fuel level", data["Fuel level"])
      barG.style.width = data["Fuel level"]
      bar.appendChild(barG)
      content.appendChild(bar)
      var range = createElement("div", ["range", "item"], "Range", this.units("KM", data["Range"]))
      content.appendChild(range)
      var consumption = createElement("div", ["consumption", "item"], "Fuel consumption", this.units("LPKM", data["Fuel consumption"]))
      content.appendChild(consumption)
      var odometer = createElement("div", ["odometer", "item"], "Odometer", this.units("KM", data["Odometer"]))
      content.appendChild(odometer)
      var avgspd = createElement("div", ["avgSpeed", "item"], "Average speed", this.units("KMH", data["Average speed"]))
      content.appendChild(avgspd)
      sec.appendChild(content)
      dom.appendChild(sec)
    }
    if (this.config.display.notice) {
      var sec = createElement("div", ["notice", "section"])
      var content = createElement("div", ["content"])
      content._add = function (key, value) {
        var d = createElement("span", ["item", "mark"], "", key)
        d.classList.add(value.toLowerCase())
        this.appendChild(d)
      }
      if (
        data["Front right tyre"] !== "OK"
        || data["Front left tyre"] !== "OK"
        || data["Rear right tyre"] !== "OK"
        || data["Rear left tyre"] !== "OK"
      ) {
        data["Tyre"] = "Error"
      } else {
        data["Tyre"] = "OK"
      }

      var list = [
        "Door lock", "Engine", "Heater", "Tyre", "Hood", "Tailgate", "Washer fluid",
        "Brake Fluid", "Bulbs", "Doors", "Windows", "Service",
      ]
      for (var i = 0; i < list.length; i++) {
        content._add(list[i], data[list[i]])
      }
      sec.appendChild(content)
      dom.appendChild(sec)
    }
    if (this.config.display.trip && this.trips.hasOwnProperty(carId)) {
      var card = (dom, pos, time, icon) => {
        var str = createElement("div", ["street"], icon, pos["streetAddress"])
        var city = createElement("div", ["city"], "", (pos["city"] + ", " + pos["ISO2CountryCode"]))
        var time = createElement("div", ["time"], "", moment.unix(time).format(this.config.timestampFormat))
        dom.appendChild(str)
        dom.appendChild(city)
        dom.appendChild(time)
        return dom
      }
      var dur = (x, y) => {
        return moment("2015-01-01").startOf('day').seconds(y - x).format(this.config.durationFormat)
      }
      var trip = this.trips[carId]
      var sec = createElement("div", ["trip", "section"])
      var content = createElement("div", ["content"])
      var start = createElement("div", ["item", "departure"])
      content.appendChild(card(start, trip.startPosition, trip.startTime, "Departure"))
      var end = createElement("div", ["item", "arrival"])
      content.appendChild(card(end, trip.endPosition, trip.endTime, "Arrival"))
      var duration = createElement("div", ["item", "duration", "bit"], "Duration", dur(trip.startTime, trip.endTime))
      content.appendChild(duration)
      var distance = createElement("div", ["item", "distance", "bit"], "Distance", this.units("KM", Math.round(trip.distance / 10) / 100))
      content.appendChild(distance)
      var s = (trip.distance / 1000) / ((trip.endTime - trip.startTime) / 3600)
      var speed = createElement("div", ["item", "avgspd", "bit"], "Average speed", this.units("KMH", s))
      content.appendChild(speed)
      var l = trip.fuelConsumption * 1000 / trip.distance
      var consump = createElement("div", ["item", "consumption", "bit"], "Fuel consumption", this.units("LPKM", l))
      content.appendChild(consump)
      sec.appendChild(content)
      dom.appendChild(sec)
    }
    return dom
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "DOM_OBJECTS_CREATED") {
      this.sendSocketNotification("INIT", this.config)
    }
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "INITIALIZED") {
      this.carInfo = payload
      this.polling()
    }
    if (noti == "SCAN_RESULT") {
      this.result = payload
      this.cycleScreen()
    }
    if (noti == "TRIP_RESULT") {
      this.trips[payload.id] = payload.data
    }
  },

  cycleScreen: function() {
    setTimeout(this.cycle)
    this.cycle = null
    setTimeout(()=>{
      this.updateDom()
    }, 1000)
    this.cycle = setTimeout(()=>{
      if (this.index >= this.result.length - 1) {
        this.index = 0
      } else {
        this.index++
      }
      this.cycleScreen()
    }, this.config.refreshInterval)
  },

  polling: function() {
    setTimeout(this.poll)
    this.poll = null
    this.sendSocketNotification("SCAN")
    this.poll = setTimeout(()=>{
      this.polling()
    }, this.config.scanInterval)
  }

})
