

// ===== Shaders =====
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec4 u_Color;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = u_Color;\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'uniform vec3 u_SpecularLight;\n' +
  'uniform float u_Shininess;\n' +
  'uniform vec3 u_ViewPosition;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDir = normalize(u_LightPosition - v_Position);\n' +
  '  float nDotL = max(dot(normal, lightDir), 0.0);\n' +
  '\n' +
  '  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '\n' +
  '  vec3 viewDir = normalize(u_ViewPosition - v_Position);\n' +
  '  vec3 reflectDir = reflect(-lightDir, normal);\n' +
  '  float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);\n' +
  '  vec3 specular = u_SpecularLight * spec;\n' +
  '\n' +
  '  gl_FragColor = vec4(diffuse + ambient + specular, v_Color.a);\n' +
  '}\n';

// ===== matrix  =
var g_matrixStack = [];
function pushMatrix(m) {
  g_matrixStack.push(new Matrix4(m));
}
function popMatrix() {
  return g_matrixStack.pop();
}

// ===== Helpers =====
function setColor(gl, u_Color, r, g, b, a) {
  gl.uniform4f(u_Color, r, g, b, a);
}


function drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
                  u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
                  sx, sy, sz) {

  var partMatrix = new Matrix4(modelMatrix);
  partMatrix.scale(sx, sy, sz);

  gl.uniformMatrix4fv(u_ModelMatrix, false, partMatrix.elements);

  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(partMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  normalMatrix.setInverseOf(partMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}


function main() {
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to init shaders');
    return;
  }

  var n = initCubeBuffers(gl);
  if (n < 0) {
    console.log('Failed to init cube buffers');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Uniform locations
  var u_MvpMatrix     = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_ModelMatrix   = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_NormalMatrix  = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_Color         = gl.getUniformLocation(gl.program, 'u_Color');

  var u_LightColor    = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight  = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_SpecularLight = gl.getUniformLocation(gl.program, 'u_SpecularLight');
  var u_Shininess     = gl.getUniformLocation(gl.program, 'u_Shininess');
  var u_ViewPosition  = gl.getUniformLocation(gl.program, 'u_ViewPosition');

  if (!u_MvpMatrix || !u_ModelMatrix || !u_NormalMatrix || !u_Color ||
      !u_LightColor || !u_LightPosition || !u_AmbientLight ||
      !u_SpecularLight || !u_Shininess || !u_ViewPosition) {
    console.log('Failed to get uniform locations');
    return;
  }

  
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(u_LightPosition, 4.0, 6.0, 5.0);
  gl.uniform3f(u_AmbientLight, 0.20, 0.20, 0.20);

  gl.uniform3f(u_SpecularLight, 1.0, 1.0, 1.0);
  gl.uniform1f(u_Shininess, 32.0);

 
  var eyeX = 7.0, eyeY = 7.0, eyeZ = 16.0;
  gl.uniform3f(u_ViewPosition, eyeX, eyeY, eyeZ);


  var vpMatrix = new Matrix4();
  vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
  vpMatrix.lookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);


  var modelMatrix  = new Matrix4();
  var mvpMatrix    = new Matrix4();
  var normalMatrix = new Matrix4();

 
  var shoulderL = 20, elbowL = 20;
  var shoulderR = -20, elbowR = 15;
  var hipL = 10, kneeL = -15;
  var hipR = -10, kneeR = 20;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  
  var bodySX = 2.0, bodySY = 2.4, bodySZ = 1.0;
  var headSX = 1.6, headSY = 1.2, headSZ = 1.2;

  var upperArmSX = 0.6, upperArmSY = 1.0, upperArmSZ = 0.6;
  var lowerArmSX = 0.5, lowerArmSY = 1.0, lowerArmSZ = 0.5;

  var upperLegSX = 0.7, upperLegSY = 1.2, upperLegSZ = 0.7;
  var lowerLegSX = 0.7, lowerLegSY = 1.2, lowerLegSZ = 0.7;

 
  modelMatrix.setIdentity();
  var bodyBase = new Matrix4(modelMatrix);

  setColor(gl, u_Color, 0.20, 0.55, 0.95, 1.0); // blue
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           bodySX, bodySY, bodySZ);

  
  modelMatrix.set(bodyBase);
  modelMatrix.translate(0.0, bodySY + headSY + 0.05, 0.0);
  setColor(gl, u_Color, 0.95, 0.80, 0.20, 1.0); // yellow
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           headSX, headSY, headSZ);


  modelMatrix.set(bodyBase);
  modelMatrix.translate(-(bodySX + upperArmSX + 0.05), bodySY - 0.4, 0.0);
  modelMatrix.rotate(shoulderL, 1, 0, 0);

 
  pushMatrix(modelMatrix);
    modelMatrix.translate(0.0, -upperArmSY, 0.0);
    setColor(gl, u_Color, 0.20, 0.85, 0.35, 1.0); // green
    drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
             u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
             upperArmSX, upperArmSY, upperArmSZ);
  modelMatrix = popMatrix();

  
  modelMatrix.translate(0.0, -(2.0 * upperArmSY), 0.0);
  modelMatrix.rotate(elbowL, 1, 0, 0);
  modelMatrix.translate(0.0, -lowerArmSY, 0.0);
  setColor(gl, u_Color, 0.10, 0.70, 0.30, 1.0);
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           lowerArmSX, lowerArmSY, lowerArmSZ);

  // ===== RIGHT ARMS block=====
  modelMatrix.set(bodyBase);
  modelMatrix.translate((bodySX + upperArmSX + 0.05), bodySY - 0.4, 0.0);
  modelMatrix.rotate(shoulderR, 1, 0, 0);

  pushMatrix(modelMatrix);
    modelMatrix.translate(0.0, -upperArmSY, 0.0);
    setColor(gl, u_Color, 0.25, 0.75, 0.25, 1.0);
    drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
             u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
             upperArmSX, upperArmSY, upperArmSZ);
  modelMatrix = popMatrix();

  modelMatrix.translate(0.0, -(2.0 * upperArmSY), 0.0);
  modelMatrix.rotate(elbowR, 1, 0, 0);
  modelMatrix.translate(0.0, -lowerArmSY, 0.0);
  setColor(gl, u_Color, 0.10, 0.60, 0.20, 1.0);
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           lowerArmSX, lowerArmSY, lowerArmSZ);

  // ===== LEFT LEGS =====
  modelMatrix.set(bodyBase);
  modelMatrix.translate(-0.7, -(bodySY + 0.05), 0.0);
  modelMatrix.rotate(hipL, 1, 0, 0);

  pushMatrix(modelMatrix);
    modelMatrix.translate(0.0, -upperLegSY, 0.0);
    setColor(gl, u_Color, 0.75, 0.30, 0.95, 1.0); // purple
    drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
             u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
             upperLegSX, upperLegSY, upperLegSZ);
  modelMatrix = popMatrix();

  modelMatrix.translate(0.0, -(2.0 * upperLegSY), 0.0);
  modelMatrix.rotate(kneeL, 1, 0, 0);
  modelMatrix.translate(0.0, -lowerLegSY, 0.0);
  setColor(gl, u_Color, 0.60, 0.20, 0.85, 1.0);
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           lowerLegSX, lowerLegSY, lowerLegSZ);

  // ===== RIGHT LEGS =====
  modelMatrix.set(bodyBase);
  modelMatrix.translate(0.7, -(bodySY + 0.05), 0.0);
  modelMatrix.rotate(hipR, 1, 0, 0);

  pushMatrix(modelMatrix);
    modelMatrix.translate(0.0, -upperLegSY, 0.0);
    setColor(gl, u_Color, 0.70, 0.25, 0.90, 1.0);
    drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
             u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
             upperLegSX, upperLegSY, upperLegSZ);
  modelMatrix = popMatrix();

  modelMatrix.translate(0.0, -(2.0 * upperLegSY), 0.0);
  modelMatrix.rotate(kneeR, 1, 0, 0);
  modelMatrix.translate(0.0, -lowerLegSY, 0.0);
  setColor(gl, u_Color, 0.55, 0.15, 0.80, 1.0);
  drawPart(gl, n, vpMatrix, modelMatrix, mvpMatrix, normalMatrix,
           u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,
           lowerLegSX, lowerLegSY, lowerLegSZ);
}

// ===== Cube buffers =====
function initCubeBuffers(gl) {
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0
  ]);

  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0
  ]);

  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,
     4, 5, 6,   4, 6, 7,
     8, 9,10,   8,10,11,
    12,13,14,  12,14,15,
    16,17,18,  16,18,19,
    20,21,22,  20,22,23
  ]);

  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) return -1;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, num) {
  var buffer = gl.createBuffer();
  if (!buffer) return false;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) return false;

  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
  return true;
}
