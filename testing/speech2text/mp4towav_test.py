import moviepy.editor as mp
my_clip = mp.VideoFileClip(r"../face_recognition/videos/lmg.mp4")
my_clip.audio.write_audiofile(r"../face_recognition/audio/lmg.wav", fps=16000, ffmpeg_params=["-ac", "1"])