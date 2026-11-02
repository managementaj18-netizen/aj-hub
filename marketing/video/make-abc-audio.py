# Builds the sound track of the English Friends promo: the word voices and game sounds at the moments they
# happened in the recording, over an original calm, bouncy tune that gets quieter while a word is spoken.
import json,subprocess,sys,glob,os,numpy as np,wave
SR=24000
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/sc/abcv'
AUD=glob.glob('/home/user/aj-hub/game/public/try-*/abc/audio')[0]
d=json.load(open(OUT+'/events.json'));cuts=d['cuts'];D=d['duration'];LAG=d.get('lag',0)
def kept(t):
    off=0
    for a,b in cuts:
        if t>=b:off+=b-a
        elif t>a:return None
    return t-off
def midi(n):return 440*2**((n-69)/12)
def note(f,dur,v=.3,ty='sine'):
    n=int(SR*dur);t=np.arange(n)/SR;p=2*np.pi*f*t
    w=np.sin(p)+.15*np.sin(2*p) if ty=='sine' else 2/np.pi*np.arcsin(np.sin(p))
    e=np.minimum(1,t/.012)*np.exp(-t*(3.2/dur));return w*e*v
def put(buf,x,t):
    i=int(t*SR);j=min(len(buf),i+len(x))
    if 0<=i<len(buf):buf[i:j]+=x[:j-i]
N=int(D*SR)+SR*2
# ---- music: original, calm and bouncy (92 bpm), made from pure tones
mus=np.zeros(N);bpm=92;sd=60/bpm/2
HOOK=[72,74,76,79,76,74,72,0,74,76,79,81,79,76,74,0];BASS=[48,48,55,55,53,53,55,55]
CH=[[60,64,67],[60,64,67],[65,69,72],[67,71,74]]
k=0
while k*sd<D+1:
    i=k%16;t=k*sd
    if HOOK[i]:put(mus,note(midi(HOOK[i]),sd*1.7,.20,'tri'),t)
    if i%2==0:put(mus,note(midi(BASS[(i//2)%8]),sd*1.9,.26),t)
    if i%8==0:
        for c in CH[(k//8)%4]:put(mus,note(midi(c),sd*7,.05),t)
    if i%4==2:put(mus,(np.random.RandomState(k).randn(int(SR*.04))*np.exp(-np.arange(int(SR*.04))/SR*90)*.05),t)
    k+=1
# ---- voices + sounds at their real moments
vo=np.zeros(N);fx=np.zeros(N);vt=[]
def dec(p):
    o=subprocess.run(['ffmpeg','-v','error','-i',p,'-f','s16le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(o,dtype='<i2').astype(float)/32768
for e in d['events']:
    t=kept(e['t'])
    if t is None or t<0:continue
    t+=LAG
    if e['type']=='say':
        x=dec(f"{AUD}/{e['w'].lower()}.mp3");put(vo,x*1.0,t+.03);vt.append((t,t+len(x)/SR))
    elif e['type']=='ok':
        for n,dt,du in [(79,0,.18),(84,.08,.3),(88,.17,.4)]:put(fx,note(midi(n),du,.35),t+dt)
    elif e['type'] in('tap','tile'):put(fx,note(midi(84),.1,.25),t)
    elif e['type']=='win':
        for i,n in enumerate([72,72,79,76,84,79,88,91]):put(fx,note(midi(n),.35,.32),t+i*.13)
# duck music under words and sounds
env=np.ones(N)
for a,b in vt:
    i0=max(0,int((a-.15)*SR));i1=min(N,int((b+.3)*SR));env[i0:i1]=.3
from numpy import convolve
env=convolve(env,np.ones(int(SR*.08))/int(SR*.08),mode='same')
fi=int(SR*1.2);fo=int(SR*2.5);mus[:fi]*=np.linspace(0,1,fi);mus[int(D*SR)-fo:int(D*SR)]*=np.linspace(1,0,fo);mus[int(D*SR):]=0
mix=mus*env*.42+vo*1.5+fx*.55
mix=mix[:int(D*SR)];mix=np.tanh(mix*1.1)*.9
with wave.open(OUT+'/audio.wav','w') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
print('audio ok',round(D,1),'s')
