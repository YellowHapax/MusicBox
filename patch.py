import os

with open(r'I:\Downloads\Groove Box 7\src\audio.ts', 'r', encoding='utf-8') as f:
    audio = f.read()

audio = audio.replace("compositionMode = false;", "view: 'live' | 'grid' = 'live';")
audio = audio.replace("compositionMode ?", "this.view === 'grid' ?")
audio = audio.replace("compositionMode", "view")
audio = audio.replace("demon", "subdominant")
audio = audio.replace("slumber", "tonic")
audio = audio.replace("hero", "dominant")

# Ensure 16 bars = 256 steps
audio = audio.replace("if (this.currentStep >= 64)", "if (this.currentStep >= 256)")

with open(r'src\audio.ts', 'w', encoding='utf-8') as f:
    f.write(audio)

with open(r'I:\Downloads\Groove Box 7\src\App.tsx', 'r', encoding='utf-8') as f:
    app = f.read()

app = app.replace("const [compositionMode, setCompositionMode] = useState(engine.compositionMode);", "const [view, setView] = useState<'live' | 'grid'>(engine.view);")
app = app.replace("compositionMode ?", "view === 'grid' ?")
app = app.replace("compositionMode", "view")
app = app.replace("engine.view = false;", "engine.view = 'live';")
app = app.replace("engine.view = true;", "engine.view = 'grid';")
app = app.replace("setView(false)", "setView('live')")
app = app.replace("setView(true)", "setView('grid')")
app = app.replace("demon", "subdominant")
app = app.replace("slumber", "tonic")
app = app.replace("hero", "dominant")

app = app.replace("view ? engine.compositionStanzas[seqStep] : currentStanza", "view === 'grid' ? engine.compositionStanzas[seqStep] : currentStanza")

# Change app references to compositionStanzas
app = app.replace("compositionStanzas", "viewStanzas")
audio = audio.replace("compositionStanzas", "viewStanzas")

with open(r'src\audio.ts', 'w', encoding='utf-8') as f:
    f.write(audio)

with open(r'src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(app)
