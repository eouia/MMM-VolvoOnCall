const exec = require('child_process').exec
const spawn = require('child_process').spawn
const moment = require("moment")

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function() {
    this.config = null
    this.carInfo = []
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "SCAN") {
      this.scan()
      this.trip()
    }
    if (noti == "INIT") {
      this.config = payload
      this.list()
    }
  },

  list: function() {
    exec("voc list", (e, sdo, sde)=>{
      if (e) {
        console.log("[VOC] ERROR(>list):", e.toString())
      } else {
        this.listResult(sdo)
      }
    })
  },

  listResult: function(output) {
    var re = /^([^ ]+)\s\(([^\)]+)\)\s([^ ]+)$/gm
    var matches = null
    var result = []
    while (matches = re.exec(output)) {
      this.carInfo.push({
        id: matches[1],
        type: matches[2],
        vin: matches[3]
      })
    }
    if (this.carInfo.length > 0) {
      this.sendSocketNotification("INITIALIZED", this.carInfo)
    } else {
      console.log("[VOC] ERROR: No vehicle found. Check your account. Module stopped.")
    }

  },


  scan: function() {
    exec("voc dashboard", (e, sdo, sde)=> {
      if (e) {
        console.log("[VOC] ERROR:", e.toString())
      } else {
        this.scanResult(sdo)
        //this.sendSocketNotification("RESULT", sdo)
      }
    })
  },

  scanResult: function(output) {
    var carIndex = this.carInfo.map((value, index, array)=>{
      return value.id
    })
    var result = []
    var re = /^([^\s]+)\s([\w\s]+)\:\s(.+)$/gm
    var matches = null
    while (matches = re.exec(output)) {
      var idx = carIndex.indexOf(matches[1])
      var key = matches[2].trim()
      var value = this.reformValue(key, matches[3].trim())
      if (typeof result[idx] == 'undefined') {
        result[idx] = []
      }
      result[idx].push({
        id: matches[1],
        key: key,
        value: value
      })
    }

    if (Object.keys(result).length == 0) {
      console.log("[VOC] ERROR: No information could be retrieved.")
      console.log(output)
    } else {
      this.sendSocketNotification("SCAN_RESULT", result)
    }
  },

  reformValue: function(key, value) {
    if (key == "Position") {
      var re = /([0-9\.\-]+)\,\s([0-9\.\-]+),\s\'([^\']+)\'/
      var matches = re.exec(value)
      if (matches) {
        return {
          lat: matches[1],
          long: matches[2],
          time: moment(matches[3]).format("X")
        }
      } else {
        return null
      }
    }
    if (key == "Fuel level") {
      return value.replace(/\s/, "")
    }
    if (key == "Fuel amount" || key == "Range" || key == "Odometer" || key == "Average speed") {
      return value.replace(/[^0-9\.]+/g, '')
    }
    if (key == "Fuel consumption") {
      var re = /^([0-9\.]+)/g
      var matches = re.exec(value)
      if (matches) {
        return matches[1]
      }
    }

    return value
  },

  trip: function() {
    for(var i = 0; i < this.carInfo.length; i++) {
      try {
        carId = this.carInfo[i].id
        var sdo = ""
        var result = spawn('voc', [
          '-i', carId,
          '--json', 'trips'
        ])
        result.stdout.on('data', (data)=>{
          sdo += data
        })
        result.on('close', (killcode)=>{
          this.tripResult(carId, JSON.parse(sdo))
        })
      } catch (e) {
        console.log("[VOC] ERROR:", e.toString())
      }
    }
  },

  tripResult: function(carId, obj) {
    if (Array.isArray(obj) && obj.length > 0) {
      var trip = obj[0]
      var detail = trip.tripDetails[0]
      var ret = {
        title: trip.name,
        category: trip.category,
        note: trip.userNotes,
        fuelConsumption : detail.fuelConsumption,
        electricalConsumption : detail.electricalConsumption,
        electricalRegeneration: detail.electricalRegeneration,
        distance: detail.distance,
        startTime: moment(detail.startTime).format("X"),
        startPosition: detail.startPosition,
        endTime: moment(detail.endTime).format("X"),
        endPosition: detail.endPosition,
      }
      this.sendSocketNotification("TRIP_RESULT", {id:carId, data:ret})
    } else {
      return
    }
  }

})
