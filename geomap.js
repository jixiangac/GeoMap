/*
 * GeoMap v0.2
 * https://github.com/x6doooo/GeoMap
 *
 * Copyright 2013 Dx. Yang
 * Released under the MIT license
 */

(function($){

  var convertor = {
    "xmin": 360,
    "xmax": 0,
    "ymin": 180,
    "ymax": 0,
    "makePoint": function(p){
      var self = this,
          x = (p[0] < -168.5 ? p[0] + 360 : p[0]) + 170,
          y = (90 - p[1]);

      if(self.xmin > x) self.xmin = x;
      if(self.xmax < x) self.xmax = x;
      if(self.ymin > y) self.ymin = y;
      if(self.ymax < y) self.ymax = y;

      return [x, y];
    },
    "Point": function(coordinates){
      coordinates = this.makePoint(coordinates);
      return coordinates.join(',');
    },
    "LineString": function(coordinates){
      var str = '',
          self = this;
      coordinates.forEach(function(point, idx){
        point = self.makePoint(point);
        if(idx == 0){
          str = 'M' + point.join(',');
        }else{
          str = str + 'L' + point.join(',');
        }
      });
      return str;
    },
    "Polygon": function(coordinates){
      var str = '';
      coordinates.forEach(function(line, idx){
        str = str + convertor.LineString(line) + 'z';
      });
      return str;
    },
    "MultiPoint": function(coordinates){
      var arr = [];
      coordinates.forEach(function(p){
        arr.push(convertor.Point(p));
      });
      return arr;
    },
    "MultiLineString": function(coordinates){
      var str = '';
      coordinates.forEach(function(line){
        str += convertor.LineString(line);
      });
      return str;
    },
    "MultiPolygon": function(coordinates){
      var str = '';
      coordinates.forEach(function(line){
        str += convertor.Polygon(line);
      });
      return str;
    }
  },
  GeoMap = function(cfg){
    var self = this,
        defaultCfg = {
          container: 'body',
          offset: null,
          scale: null,
          mapStyle: {
            'fill': '#fff',
            'stroke': '#999',
            'stroke-width': 0.7
          }
        };

    $.extend(true, defaultCfg, cfg);

    self.container = $(defaultCfg.container);
    self.width = defaultCfg.width || self.container.width();
    self.height = defaultCfg.height || self.container.height();
    self.canvas = new Raphael(self.container.get(0), self.width, self.height);
    self.mapStyle = defaultCfg.mapStyle;
    self.scale = defaultCfg.scale;
    self.offset = defaultCfg.offset;
    self.shapes = self.canvas.set();
    self.json = null;
    self.paths = null;
  };

  GeoMap.prototype = {
    load: function(json){
      this.paths = this.json2path(json);
    },
    render: function(){
      var self = this,
        paths = self.paths,
        canvas = self.canvas,
        style = self.mapStyle,
        aPath = null,
        offset = self.offset,
        scale = self.scale,
        width = self.width,
        height = self.height;

      if(!scale){
        scale = {
          x: 1, y: 1
        };
      }

      if(!offset){
        offset = {
          x: convertor.xmin * scale.x,
          y: convertor.ymin * scale.y
        };
      }

      paths.forEach(function(path){
        if(path.type == 'point' || path.type == 'MultiPoint'){
        }else{
          aPath = canvas.path(path.path).attr(style).scale(scale.x, scale.y, 0, 0).data('properties', path.properties);
        }
        self.shapes.push(aPath);
      });

      canvas.setViewBox(offset.x, offset.y, width, height, false);
    },
    json2path: function(json){
      var self = this,
        shapes = json.features,
        shapeType,
        shapeCoordinates,
        str,
        geometries,
        pathArray = [];

      convertor.xmin= 360;
      convertor.xmax = 0;
      convertor.ymin = 180;
      convertor.ymax = 0;

      shapes.forEach(function(shape, idx, arr){
        if(shape.type == 'Feature'){
          pushApath(shape.geometry, shape);
        }else if(shape.type = 'GeometryCollection'){
          geometries = shape.geometries;
          geometries.forEach(function(val){
            pushApath(val, val);
          });
        }
      });
      function pushApath(gm, shape){
        shapeType = gm.type;
        shapeCoordinates = gm.coordinates;
        str = convertor[shapeType](shapeCoordinates);
        pathArray.push({
          type: shapeType,
          path: str,
          properties: shape.properties
        });
      }
      return pathArray;
    }
  };

  window.GeoMap = GeoMap;
})(jQuery);