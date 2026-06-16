# Cinematic music bed

Place a long-form ambient documentary score here as
`cinematic_doc_bed.mp3` (≥15 min, -22 LUFS).

The FFmpeg `duck_music_under_narration` filter sidechains this track
beneath the ElevenLabs narration so the music drops by ~85% (`AUDIO_DUCK_DB=-15`)
whenever the voice is active.
