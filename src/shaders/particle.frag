uniform sampler2D texture;
uniform float opacity;

varying vec3 vColor;
varying float vDiscard;
varying vec2 vPathPos;
varying float vOpacity;

void main() {

    if (vDiscard == 1.0) {
        discard;
    }

    // light blue
    float r = 0.7;
    float g = 1.0;
    float b = 1.0;

    // light green
    /* float r = 23.0 / 255.0; */
    /* float g = 220.0 / 255.0; */
    /* float b = 41.0 / 255.0; */

    /* gl_FragColor = vec4( color, 1.0 ); */
    /* vec4 color = vec4(r, g, b, vOpacity); */
    vec4 color = vec4(vColor, vOpacity);

    vec2 texCoord = gl_PointCoord.xy; // copy the coordinate within the particle
    texCoord.y = 1.0 - texCoord.y; // flip the y axis so the image is upright

    gl_FragColor = color * texture2D( texture, texCoord );
}
