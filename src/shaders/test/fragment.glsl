

uniform sampler2D u_texture;
varying vec2 vUv;


void main()
{
    vec4 texColor = texture2D(u_texture, vUv);
    gl_FragColor = vec4(texColor.rgb, 1.0);
}