import { pixelation } from '../constants/others';

export const scrollFs = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;

    uniform sampler2D uRenderTexture;

    // lerped scroll deltas
    // negative when scrolling down, positive when scrolling up
    uniform float uScrollEffect;

    // default to 2.5
    uniform float uScrollStrength;


    void main() {
        vec2 scrollTextCoords = vTextureCoord;
        float horizontalStretch;

        // branching on an uniform is ok
        if(uScrollEffect >= 0.0) {
            scrollTextCoords.y *= 1.0 + -uScrollEffect * 0.00625 * uScrollStrength;
            horizontalStretch = sin(scrollTextCoords.y);
        }
        else if(uScrollEffect < 0.0) {
            scrollTextCoords.y += (scrollTextCoords.y - 1.0) * uScrollEffect * 0.00625 * uScrollStrength;
            horizontalStretch = sin(-1.0 * (1.0 - scrollTextCoords.y));
        }

        scrollTextCoords.x = scrollTextCoords.x * 2.0 - 1.0;
        scrollTextCoords.x *= 1.0 + uScrollEffect * 0.0035 * horizontalStretch * uScrollStrength;
        scrollTextCoords.x = (scrollTextCoords.x + 1.0) * 0.5;

        gl_FragColor = texture2D(uRenderTexture, scrollTextCoords);
    }
`;

export const vs = `
precision lowp float;

// default mandatory variables
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform mat4 planeTextureMatrix;

// custom varyings
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

void main() {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

    // varyings
    vVertexPosition = aVertexPosition;
    vTextureCoord = aTextureCoord;
}
`;

export const fs = `
precision lowp float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform float uTime;

uniform sampler2D planeTexture;

void main() {
    // just distort the text a bit
    vec2 textureCoords = vTextureCoord;
    textureCoords.x += sin(uTime / 30.0) / 100.0 * cos(textureCoords.y * 20.0);

    gl_FragColor = texture2D(planeTexture, textureCoords);
}
`;

export const blurPixelatedFs = `
precision lowp float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;

uniform float uGranularity;
uniform vec2 uResolution;

uniform float uTime;
uniform float uStep;
uniform vec2 uResUnit;

void main() {
  if(uGranularity > 0.0){
    
    // Calculate granularity based on vTextureCoord.y
    // float roundedCoord = floor(vTextureCoord.y * 10.0 + 0.5) / 10.0;
    // float granularity = mix(uGranularity, .01, roundedCoord);
    // float granularity = uGranularity;
    // float tx = mod(uTime, uResUnit.x);  
    float ty = floor(uTime / uResUnit.x);
    float ty_ = ty + 1.;
    float vty = (1. - vTextureCoord.y) * uResUnit.y;
    // float vtx = vTextureCoord.x * uResUnit.x;
    float granularity = uGranularity + uStep;
    if (vty <= ty) {
      granularity = uGranularity;
    } 

    const float Pi = 6.28318530718; // Pi*2
    const float Directions = 16.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    const float Quality = 4.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    const float PiDirections = Pi/Directions;
    vec2 Radius = granularity/2.0/uResolution.xy;

    float dx = granularity / uResolution.x;
    float dy = granularity / uResolution.y;

    vec2 colorCoord = vec2(
      dx * (floor(vTextureCoord.x / dx) + 0.5),
      dy * (floor(vTextureCoord.y / dy) + 0.5)
    );

    vec4 Color = texture2D(uRenderTexture, colorCoord);

    // Blur calculations
    for( float d=0.0; d<Pi; d+=PiDirections)
    {
      for(float i=1.0/Quality; i<=1.0; i+=1.0/Quality)
      {
        Color += texture2D(uRenderTexture, colorCoord+vec2(cos(d),sin(d))*Radius*i);
      }
    }

    // Output to screen
    Color /= Quality * Directions;
    gl_FragColor = Color;
  } else {
    gl_FragColor = texture2D(uRenderTexture, vTextureCoord);
  }
}
`;

export const simplePixelatedFs = `
precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;

uniform float uGranularity;
uniform vec2 uResolution;

void main() {
  if(uGranularity > 0.0){
    float dx = uGranularity / uResolution.x;
    float dy = uGranularity / uResolution.y;

    vec2 colorCoord = vec2(
      dx * (floor(vTextureCoord.x / dx) + 0.5),
      dy * (floor(vTextureCoord.y / dy) + 0.5)
    );

    gl_FragColor = texture2D(uRenderTexture, colorCoord);
  } else {
    gl_FragColor = texture2D(uRenderTexture, vTextureCoord);
  }
}
`;

export const progrssiveRenderingFs = `
precision mediump float;

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

uniform sampler2D uRenderTexture;

uniform vec2 uResolution;

void main() {
    float numPasses = 5.0; // Number of progressive rendering passes
    float totalGranularity = 10.0; // Total granularity for the entire image
    float region1Granularity = 3.0; // Granularity for the upper region
    float region2Granularity = 7.0; // Granularity for the lower region

    vec2 texCoord = vTextureCoord;
    
    float dx1 = region1Granularity / uResolution.x;
    float dy1 = region1Granularity / uResolution.y;
    float dx2 = region2Granularity / uResolution.x;
    float dy2 = region2Granularity / uResolution.y;

    float pass = floor(mod(gl_FragCoord.x + gl_FragCoord.y, numPasses)); // Calculate the current pass

    vec4 color;

    // Determine the granularity level for the current pixel
    if (texCoord.y < 0.5) { // Upper region
        vec2 colorCoord = vec2(
            dx1 * (floor(texCoord.x / dx1) + 0.5),
            dy1 * (floor(texCoord.y / dy1) + 0.5)
        );
        color = texture2D(uRenderTexture, colorCoord);
    } else { // Lower region
        vec2 colorCoord = vec2(
            dx2 * (floor(texCoord.x / dx2) + 0.5),
            dy2 * (floor(texCoord.y / dy2) + 0.5)
        );
        color = texture2D(uRenderTexture, colorCoord);
    }

    // Apply only if it's the pass for this granularity level
    if (pass * totalGranularity / numPasses <= region1Granularity && texCoord.y < 0.5) {
        gl_FragColor = color;
    } else if (pass * totalGranularity / numPasses <= region2Granularity && texCoord.y >= 0.5) {
        gl_FragColor = color;
    } else {
        gl_FragColor = texture2D(uRenderTexture, vTextureCoord);
    }
}

`;
