"""
First 10 dimensions of 512-dim vectors for selected artworks (as Python lists).
In the actual app, these are stored as Float32Array in Firestore or Tower Iceberg.
"""

embeddings_mock = {
    "met_001": [  # Whistler's Mother
        0.123, -0.456, 0.789, -0.234, 0.567, -0.891, 0.234, -0.678, 0.345, -0.123,
    ] + [0.0] * 502,
    "met_002": [  # The Thinker
        0.345, -0.678, 0.123, -0.456, 0.789, -0.234, 0.567, -0.891, 0.234, -0.567,
    ] + [0.0] * 502,
    "met_003": [  # Self-Portrait
        -0.234, 0.567, -0.891, 0.234, -0.678, 0.345, -0.123, 0.456, -0.789, 0.234,
    ] + [0.0] * 502,
    "moma_001": [  # Starry Night
        0.987, -0.123, 0.456, -0.789, 0.234, -0.567, 0.891, -0.345, 0.678, -0.234,
    ] + [0.0] * 502,
    "gug_001": [  # Composition 8
        0.111, 0.222, -0.333, 0.444, -0.555, 0.666, -0.777, 0.888, -0.999, 0.123,
    ] + [0.0] * 502,
}
