# Original synthesized background music (no samples, no copied tunes). Writes two WAV files.
import numpy as np, wave, sys
SR=44100
def midi(n): return 440.0*2**((n-69)/12)
def env(n,a=.005,r=.08):
    e=np.ones(n);na=int(SR*a);nr=min(int(SR*r),n)
    if na>0:e[:na]=np.linspace(0,1,na)
    if nr>0:e[-nr:]*=np.linspace(1,0,nr)
    return e
def tone(f,d,wave_='square',vol=.3,a=.004,r=.07):
    n=int(SR*d);t=np.arange(n)/SR;p=2*np.pi*f*t
    if wave_=='square':w=np.sign(np.sin(p))*.6+np.sin(p)*.2
    elif wave_=='tri':w=2/np.pi*np.arcsin(np.sin(p))
    elif wave_=='saw':w=2*((f*t)%1)-1
    else:w=np.sin(p)
    return w*env(n,a,r)*vol
def kick(vol=.7):
    n=int(SR*.18);t=np.arange(n)/SR;f=120*np.exp(-t*28)+40;return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*18)*vol
def hat(vol=.12):
    n=int(SR*.05);return (np.random.RandomState(1).randn(n))*np.exp(-np.arange(n)/SR*90)*vol
def snare(vol=.25):
    n=int(SR*.14);t=np.arange(n)/SR;return (np.random.RandomState(2).randn(n)*.7+np.sin(2*np.pi*190*t)*.5)*np.exp(-t*24)*vol
def put(buf,x,pos):
    i=int(pos*SR);j=min(len(buf),i+len(x))
    if i<len(buf):buf[i:j]+=x[:j-i]
def render(name,dur,bpm,melody,bass,chords,drums,mel_wave,swing=0):
    buf=np.zeros(int(SR*dur));beat=60/bpm;total=int(dur/beat)
    # drums
    for b in range(total*2):
        pos=b*beat/2
        if drums:
            if b%4==0:put(buf,kick(),pos)
            if b%4==2:put(buf,snare(),pos)
            put(buf,hat(.1 if b%2 else .06),pos)
    # bass (one note per beat from the pattern)
    for b in range(total):
        n=bass[b%len(bass)]
        if n:put(buf,tone(midi(n),beat*.9,'tri',.32,.005,.1),b*beat)
    # chords (every 2 beats)
    for b in range(0,total,2):
        ch=chords[(b//2)%len(chords)]
        for n in ch:put(buf,tone(midi(n),beat*1.9,'saw',.045,.02,.2),b*beat)
    # melody (list of (step, midi, steps) in 8th notes; loops over its length)
    L=max(s+d for s,_,d in melody)
    k=0
    while k*L*beat/2<dur:
        for s,n,d in melody:
            pos=(k*L+s)*beat/2
            if pos<dur and n:put(buf,tone(midi(n),d*beat/2*.92,mel_wave,.2,.004,.06),pos)
        k+=1
    # fades + normalise
    fi=int(SR*.25);fo=int(SR*2.2);buf[:fi]*=np.linspace(0,1,fi);buf[-fo:]*=np.linspace(1,0,fo)
    buf=buf/max(1e-6,np.abs(buf).max())*.85
    with wave.open(name,'w') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((buf*32767).astype('<i2').tobytes())
# C-major pentatonic, bouncy hook (16 eighth-notes, loops)
C=60
hookA=[(0,C+12,1),(1,C+16,1),(2,C+19,2),(4,C+16,1),(5,C+12,1),(6,C+14,2),
       (8,C+17,1),(9,C+14,1),(10,C+19,2),(12,C+16,1),(13,C+14,1),(14,C+12,2)]
bassA=[36,36,43,43,41,41,43,43]
chA=[[60,64,67],[60,64,67],[65,69,72],[67,71,74]]
render('fruitcatch.wav',34,128,hookA,bassA,chA,True,'square')
# calm, cheerful "puzzle" arpeggio
hookB=[(0,C+16,2),(2,C+19,2),(4,C+21,2),(6,C+19,2),(8,C+17,2),(10,C+21,2),(12,C+24,2),(14,C+21,2)]
bassB=[48,0,55,0,53,0,55,0]
chB=[[60,64,67,71],[57,60,64,67],[65,69,72,76],[67,71,74,77]]
render('juicesort.wav',33,100,hookB,bassB,chB,False,'tri')
print('ok')
