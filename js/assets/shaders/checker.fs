precision mediump float;

varying vec2 vUv;

uniform float checkerScale;

void main() {
    vec2 uv = vUv * checkerScale;

    float cx = floor(uv.x);
    float cy = floor(uv.y);

    float checker = mod(cx + cy, 2.0);

    vec3 blue = vec3(0.1, 0.3, 0.8);
    vec3 white = vec3(0.8);

    vec3 color = mix(blue, white, checker);
    gl_FragColor = vec4(color, 1.0);
}