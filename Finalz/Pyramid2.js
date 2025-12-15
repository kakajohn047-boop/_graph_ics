// ColoredPyramid.js
// Based on the ColoredCube.js structure from the WebGL Programming Guide.

// Vertex shader program
var glCtx;
var canvasRef;

var posAttrib;
var uvAttrib;

var mvpUniform;
var samplerUniform;
var texturedFlag;
var flatColorUniform;

var pyramidBuffer;
var textureSet = [];

var rotationY = 0;
var previousTime = 0;


var VERT_SRC =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'uniform mat4 u_MVP;\n' +
  'varying vec2 v_UV;\n' +
  'void main() {\n' +
  '  gl_Position = u_MVP * a_Position;\n' +
  '  v_UV = a_UV;\n' +
  '}\n';

var FRAG_SRC =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Texture;\n' +
  'uniform int u_Textured;\n' +
  'uniform vec4 u_Color;\n' +
  'varying vec2 v_UV;\n' +
  'void main() {\n' +
  '  if (u_Textured == 1)\n' +
  '    gl_FragColor = texture2D(u_Texture, v_UV);\n' +
  '  else\n' +
  '    gl_FragColor = u_Color;\n' +
  '}\n';


function main() {
  setupCanvas();
  setupShaders();
  setupAttributes();
  setupSceneState();

  var count = buildPyramidGeometry();
  loadAllTextures(startRendering.bind(null, count));
}


function setupCanvas() {
  canvasRef = document.getElementById('webgl');
  glCtx = getWebGLContext(canvasRef);
}

function setupShaders() {
  initShaders(glCtx, VERT_SRC, FRAG_SRC);
}

function setupAttributes() {
  posAttrib = glCtx.getAttribLocation(glCtx.program, 'a_Position');
  uvAttrib  = glCtx.getAttribLocation(glCtx.program, 'a_UV');

  mvpUniform       = glCtx.getUniformLocation(glCtx.program, 'u_MVP');
  samplerUniform   = glCtx.getUniformLocation(glCtx.program, 'u_Texture');
  texturedFlag     = glCtx.getUniformLocation(glCtx.program, 'u_Textured');
  flatColorUniform = glCtx.getUniformLocation(glCtx.program, 'u_Color');

  glCtx.uniform1i(samplerUniform, 0);
}

function setupSceneState() {
  glCtx.clearColor(0, 0, 0, 1);
  glCtx.enable(glCtx.DEPTH_TEST);
}


function buildPyramidGeometry() {
  var vertexData = new Float32Array([
     0,  1,  0,   0.5, 1,
     0.5,-0.5, 0.5, 1, 0,
    -0.5,-0.5, 0.5, 0, 0,

     0,  1,  0,   0.5, 1,
    -0.5,-0.5, 0.5, 1, 0,
    -0.5,-0.5,-0.5,0, 0,

     0,  1,  0,   0.5, 1,
    -0.5,-0.5,-0.5,1, 0,
     0.5,-0.5,-0.5,0, 0,

     0,  1,  0,   0.5, 1,
     0.5,-0.5,-0.5,1, 0,
     0.5,-0.5, 0.5,0, 0,

     0.5,-0.5, 0.5,0,0,
    -0.5,-0.5,-0.5,0,0,
    -0.5,-0.5, 0.5,0,0,

     0.5,-0.5, 0.5,0,0,
     0.5,-0.5,-0.5,0,0,
    -0.5,-0.5,-0.5,0,0
  ]);

  pyramidBuffer = glCtx.createBuffer();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, pyramidBuffer);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, vertexData, glCtx.STATIC_DRAW);

  var stride = vertexData.BYTES_PER_ELEMENT * 5;

  glCtx.vertexAttribPointer(posAttrib, 3, glCtx.FLOAT, false, stride, 0);
  glCtx.enableVertexAttribArray(posAttrib);

  glCtx.vertexAttribPointer(uvAttrib, 2, glCtx.FLOAT, false, stride, stride * 3 / 5);
  glCtx.enableVertexAttribArray(uvAttrib);

  return 18;
}


function loadAllTextures(done) {
  var files = [
    './resource/particle.png',
    './resource/pinkflower.jpg',
    './resource/7herbs.jpg',
    './resource/blueflower.jpg'
  ];

  var ready = 0;

  for (var i = 0; i < files.length; i++) {
    var tex = glCtx.createTexture();
    textureSet.push(tex);

    (function(index) {
      var img = new Image();
      img.onload = function() {
        glCtx.pixelStorei(glCtx.UNPACK_FLIP_Y_WEBGL, 1);
        glCtx.activeTexture(glCtx.TEXTURE0);
        glCtx.bindTexture(glCtx.TEXTURE_2D, textureSet[index]);
        glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
        glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, img);

        ready++;
        if (ready === files.length) done();
      };
      img.src = files[index];
    })(i);
  }
}

//render part//
function startRendering(vertexCount) {
  previousTime = Date.now();
  requestAnimationFrame(frame.bind(null, vertexCount));
}

function frame(n) {
  var now = Date.now();
  var delta = (now - previousTime) / 1000;
  previousTime = now;

  rotationY += 30 * delta;

  drawScene(n);
  requestAnimationFrame(frame.bind(null, n));
}

// function to draw//
function drawScene(n) {
  glCtx.clear(glCtx.COLOR_BUFFER_BIT | glCtx.DEPTH_BUFFER_BIT);

  var vp = new Matrix4();
  vp.setPerspective(30, canvasRef.width / canvasRef.height, 1, 100);
  vp.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

  var model = new Matrix4();
  model.rotate(rotationY, 0, 1, 0);

  vp.multiply(model);
  glCtx.uniformMatrix4fv(mvpUniform, false, vp.elements);

  glCtx.uniform1i(texturedFlag, 1);
  for (var i = 0; i < 4; i++) {
    glCtx.bindTexture(glCtx.TEXTURE_2D, textureSet[i]);
    glCtx.drawArrays(glCtx.TRIANGLES, i * 3, 3);
  }

  glCtx.uniform1i(texturedFlag, 0);
  glCtx.uniform4f(flatColorUniform, 0, 0, 0, 1);
  glCtx.drawArrays(glCtx.TRIANGLES, 12, 6);
}
