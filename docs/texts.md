# FretLab — all interface text

> **Generated file.** Do not edit by hand: run `npm run texts` to rebuild it from the catalogues in
> `src/i18n/`. To change a translation, edit the language file named in the table below, then regenerate.

## How to read this file

- Every piece of text the application shows or speaks is listed once, under the part of the page it belongs to.
- Each entry gives its **key** (the name the code uses) and the text in all six languages.
- `{name}` is a **placeholder**: the application puts a value there (a number, a note name, a chord name).
  Keep every placeholder in a translation, spelled exactly the same; move it wherever the grammar wants it.
- *When 1* shows the wording used when the number is exactly one, for messages where that differs.
- Note letters (A–G), `#` and `b`, and chord symbols such as `m7` are never translated.

## Languages

| Code | Language | File in `src/i18n/` |
| --- | --- | --- |
| `en` | English | `en.ts + music-en.ts` |
| `ko` | 한국어 | `ko.ts` |
| `ja` | 日本語 | `ja.ts` |
| `zh-Hans` | 简体中文 | `zh-Hans.ts` |
| `zh-Hant` | 繁體中文 | `zh-Hant.ts` |
| `es` | Español | `es.ts` |

## Contents

**Part 1 — Interface**

- [Language picker](#language-picker)
- [Application](#application)
- [Modes](#modes)
- [Theme](#theme)
- [Instrument](#instrument)
- [Tuning](#tuning)
- [Scale chooser](#scale-chooser)
- [Chord chooser](#chord-chooser)
- [Sound and display](#sound-and-display)
- [Current selection](#current-selection)
- [Chord shapes](#chord-shapes)
- [Strumming](#strumming)
- [Tuner](#tuner)
- [Instrument view](#instrument-view)
- [Fretboard (screen readers)](#fretboard-screen-readers)
- [Footer](#footer)
- [Error screen](#error-screen)
- [Help bubbles](#help-bubbles)

**Part 2 — Music catalogues**

- [Scales and modes](#scales-and-modes)
- [Chord types](#chord-types)
- [Group headings](#group-headings)
- [Tuning presets](#tuning-presets)
- [Why a scale fits a chord](#why-a-scale-fits-a-chord)

---

# Part 1 — Interface

## Language picker

*The language menu in the header.*

### `lang.name`

| | Text |
| --- | --- |
| **en** | English |
| **ko** | 한국어 |
| **ja** | 日本語 |
| **zh-Hans** | 简体中文 |
| **zh-Hant** | 繁體中文 |
| **es** | Español |

### `lang.label`

| | Text |
| --- | --- |
| **en** | Language |
| **ko** | 언어 |
| **ja** | 言語 |
| **zh-Hans** | 语言 |
| **zh-Hant** | 語言 |
| **es** | Idioma |

## Application

*The tagline under the logo and the skip link.*

### `app.tagline`

| | Text |
| --- | --- |
| **en** | guitar & bass fretboard |
| **ko** | 기타 · 베이스 지판 |
| **ja** | ギター・ベースの指板 |
| **zh-Hans** | 吉他与贝斯指板 |
| **zh-Hant** | 吉他與貝斯指板 |
| **es** | diapasón de guitarra y bajo |

### `app.skipToFretboard`

| | Text |
| --- | --- |
| **en** | Skip to the fretboard |
| **ko** | 지판으로 건너뛰기 |
| **ja** | 指板へスキップ |
| **zh-Hans** | 跳到指板 |
| **zh-Hant** | 跳至指板 |
| **es** | Saltar al diapasón |

## Modes

*The four mode buttons in the header and their tooltips.*

### `mode.label`

| | Text |
| --- | --- |
| **en** | Interaction mode |
| **ko** | 사용 모드 |
| **ja** | 操作モード |
| **zh-Hans** | 操作模式 |
| **zh-Hant** | 操作模式 |
| **es** | Modo de uso |

### `mode.normal`

| | Text |
| --- | --- |
| **en** | Notes |
| **ko** | 음 |
| **ja** | 単音 |
| **zh-Hans** | 单音 |
| **zh-Hant** | 單音 |
| **es** | Notas |

### `mode.scale`

| | Text |
| --- | --- |
| **en** | Scale |
| **ko** | 스케일 |
| **ja** | スケール |
| **zh-Hans** | 音阶 |
| **zh-Hant** | 音階 |
| **es** | Escala |

### `mode.chord`

| | Text |
| --- | --- |
| **en** | Chords |
| **ko** | 코드 |
| **ja** | コード |
| **zh-Hans** | 和弦 |
| **zh-Hant** | 和弦 |
| **es** | Acordes |

### `mode.tuner`

| | Text |
| --- | --- |
| **en** | Tuner |
| **ko** | 튜너 |
| **ja** | チューナー |
| **zh-Hans** | 调音器 |
| **zh-Hant** | 調音器 |
| **es** | Afinador |

### `mode.normal.help`

| | Text |
| --- | --- |
| **en** | Click any position to hear the note it produces |
| **ko** | 아무 위치나 눌러 그 자리의 음을 들어 보세요 |
| **ja** | 任意の位置を押すと、その音が鳴ります |
| **zh-Hans** | 点按任一位置即可听到该处的音 |
| **zh-Hant** | 點按任一位置即可聽見該處的音 |
| **es** | Pulsa cualquier posición para oír la nota que produce |

### `mode.scale.help`

| | Text |
| --- | --- |
| **en** | Highlight a scale or mode across the whole neck |
| **ko** | 지판 전체에 스케일이나 모드를 표시합니다 |
| **ja** | ネック全体にスケールやモードを表示します |
| **zh-Hans** | 在整条琴颈上标出音阶或调式 |
| **zh-Hant** | 在整支琴頸上標出音階或調式 |
| **es** | Resalta una escala o modo por todo el mástil |

### `mode.chord.help`

| | Text |
| --- | --- |
| **en** | Show calculated chord shapes and strum them |
| **ko** | 계산된 코드 폼을 보여 주고 스트로크로 들려줍니다 |
| **ja** | 算出したコードフォームを表示し、ストロークで鳴らします |
| **zh-Hans** | 显示算出的和弦指型，并可扫弦试听 |
| **zh-Hant** | 顯示算出的和弦指型，並可刷弦試聽 |
| **es** | Muestra posiciones de acorde calculadas y las rasguea |

### `mode.tuner.help`

| | Text |
| --- | --- |
| **en** | Move the view to the headstock and tune by microphone |
| **ko** | 헤드로 화면을 옮겨 마이크로 조율합니다 |
| **ja** | 表示をヘッドへ移し、マイクでチューニングします |
| **zh-Hans** | 把视角移到琴头，用麦克风调音 |
| **zh-Hant** | 把視角移到琴頭，用麥克風調音 |
| **es** | Lleva la vista a la pala y afina con el micrófono |

## Theme

*The dark / light switch in the header.*

### `theme.label`

| | Text |
| --- | --- |
| **en** | Colour theme |
| **ko** | 색 테마 |
| **ja** | 配色テーマ |
| **zh-Hans** | 配色主题 |
| **zh-Hant** | 配色主題 |
| **es** | Tema de color |

### `theme.dark`

| | Text |
| --- | --- |
| **en** | Dark |
| **ko** | 어둡게 |
| **ja** | ダーク |
| **zh-Hans** | 深色 |
| **zh-Hant** | 深色 |
| **es** | Oscuro |

### `theme.light`

| | Text |
| --- | --- |
| **en** | Light |
| **ko** | 밝게 |
| **ja** | ライト |
| **zh-Hans** | 浅色 |
| **zh-Hant** | 淺色 |
| **es** | Claro |

## Instrument

*The instrument card.*

### `instrument.title`

| | Text |
| --- | --- |
| **en** | Instrument |
| **ko** | 악기 |
| **ja** | 楽器 |
| **zh-Hans** | 乐器 |
| **zh-Hant** | 樂器 |
| **es** | Instrumento |

### `instrument.type`

| | Text |
| --- | --- |
| **en** | Type |
| **ko** | 종류 |
| **ja** | 種類 |
| **zh-Hans** | 类型 |
| **zh-Hant** | 類型 |
| **es** | Tipo |

### `instrument.strings`

| | Text |
| --- | --- |
| **en** | Strings |
| **ko** | 현 수 |
| **ja** | 弦数 |
| **zh-Hans** | 弦数 |
| **zh-Hant** | 弦數 |
| **es** | Cuerdas |

### `instrument.stringCount`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | {n}-string |
| **ko** | {n}현 |
| **ja** | {n}弦 |
| **zh-Hans** | {n}弦 |
| **zh-Hant** | {n}弦 |
| **es** | {n} cuerdas |

### `instrument.option.help`

Placeholders: `{name}`, `{frets}`

| | Text |
| --- | --- |
| **en** | {name}, {frets} frets |
| **ko** | {name}, 프렛 {frets}개 |
| **ja** | {name}、フレット{frets}本 |
| **zh-Hans** | {name}，{frets} 个品 |
| **zh-Hant** | {name}，{frets} 個琴格 |
| **es** | {name}, {frets} trastes |

### `instrument.summary`

Placeholders: `{name}`, `{strings}`, `{frets}`, `{scale}`

| | Text |
| --- | --- |
| **en** | {name} · {strings} strings · {frets} frets · {scale}" scale |
| **ko** | {name} · {strings}현 · 프렛 {frets}개 · 스케일 길이 {scale}인치 |
| **ja** | {name} · {strings}弦 · フレット{frets}本 · スケール長{scale}インチ |
| **zh-Hans** | {name} · {strings}弦 · {frets}品 · 弦长{scale}英寸 |
| **zh-Hant** | {name} · {strings}弦 · {frets}格 · 弦長{scale}英吋 |
| **es** | {name} · {strings} cuerdas · {frets} trastes · escala de {scale}" |

### `family.guitar`

| | Text |
| --- | --- |
| **en** | Guitar |
| **ko** | 기타 |
| **ja** | ギター |
| **zh-Hans** | 吉他 |
| **zh-Hant** | 吉他 |
| **es** | Guitarra |

### `family.bass`

| | Text |
| --- | --- |
| **en** | Bass |
| **ko** | 베이스 |
| **ja** | ベース |
| **zh-Hans** | 贝斯 |
| **zh-Hant** | 貝斯 |
| **es** | Bajo |

### `instrument.guitar6`

| | Text |
| --- | --- |
| **en** | 6-string guitar |
| **ko** | 6현 기타 |
| **ja** | 6弦ギター |
| **zh-Hans** | 六弦吉他 |
| **zh-Hant** | 六弦吉他 |
| **es** | Guitarra de 6 cuerdas |

### `instrument.bass4`

| | Text |
| --- | --- |
| **en** | 4-string bass |
| **ko** | 4현 베이스 |
| **ja** | 4弦ベース |
| **zh-Hans** | 四弦贝斯 |
| **zh-Hant** | 四弦貝斯 |
| **es** | Bajo de 4 cuerdas |

## Tuning

*The tuning card and the custom tuning editor.*

### `tuning.title`

| | Text |
| --- | --- |
| **en** | Tuning |
| **ko** | 튜닝 |
| **ja** | チューニング |
| **zh-Hans** | 调弦 |
| **zh-Hant** | 調弦 |
| **es** | Afinación |

### `tuning.preset`

| | Text |
| --- | --- |
| **en** | Preset |
| **ko** | 프리셋 |
| **ja** | プリセット |
| **zh-Hans** | 预设 |
| **zh-Hant** | 預設組合 |
| **es** | Preajuste |

### `tuning.preset.help`

| | Text |
| --- | --- |
| **en** | Every note name, highlight, chord shape and tuner target is recalculated from the tuning you pick here. |
| **ko** | 여기서 고른 튜닝을 기준으로 음 이름, 강조 표시, 코드 폼, 튜너 목표음이 모두 다시 계산됩니다. |
| **ja** | ここで選んだチューニングをもとに、音名・ハイライト・コードフォーム・チューナーの目標音がすべて計算し直されます。 |
| **zh-Hans** | 这里选定的调弦会重新算出所有音名、高亮、和弦指型与调音目标音。 |
| **zh-Hant** | 這裡選定的調弦會重新算出所有音名、標示、和弦指型與調音目標音。 |
| **es** | Cada nombre de nota, resalte, posición de acorde y objetivo del afinador se recalcula a partir de la afinación que elijas aquí. |

### `tuning.custom`

| | Text |
| --- | --- |
| **en** | Custom tuning… |
| **ko** | 사용자 튜닝… |
| **ja** | カスタムチューニング… |
| **zh-Hans** | 自定义调弦… |
| **zh-Hant** | 自訂調弦… |
| **es** | Afinación personalizada… |

### `tuning.openStrings`

| | Text |
| --- | --- |
| **en** | Open strings, lowest first: |
| **ko** | 개방현(낮은 음부터): |
| **ja** | 開放弦（低い弦から）: |
| **zh-Hans** | 空弦（由低到高）： |
| **zh-Hant** | 空弦（由低到高）： |
| **es** | Cuerdas al aire, de la más grave: |

### `tuning.editor`

| | Text |
| --- | --- |
| **en** | Custom tuning editor |
| **ko** | 사용자 튜닝 편집기 |
| **ja** | カスタムチューニング編集 |
| **zh-Hans** | 自定义调弦编辑器 |
| **zh-Hant** | 自訂調弦編輯器 |
| **es** | Editor de afinación personalizada |

### `tuning.editor.hint`

| | Text |
| --- | --- |
| **en** | Give each string a note name with an octave, such as D2 or Bb1. String 1 is the lowest-pitched string. |
| **ko** | 각 현에 옥타브를 포함한 음 이름을 적어 주세요. 예: D2, Bb1. 1번 현이 가장 낮은 현입니다. |
| **ja** | 各弦にオクターブ付きの音名を入力してください。例: D2、Bb1。1弦目がいちばん低い弦です。 |
| **zh-Hans** | 为每根弦填写带八度的音名，例如 D2 或 Bb1。第 1 弦是音最低的那根。 |
| **zh-Hant** | 請為每條弦填入含八度的音名，例如 D2 或 Bb1。第 1 弦是音最低的那條。 |
| **es** | Escribe para cada cuerda un nombre de nota con octava, como D2 o Bb1. La cuerda 1 es la más grave. |

### `tuning.string`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | String {n} |
| **ko** | {n}번 현 |
| **ja** | {n}弦 |
| **zh-Hans** | 第{n}弦 |
| **zh-Hant** | 第{n}弦 |
| **es** | Cuerda {n} |

### `tuning.string.lowest`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | String {n} (lowest) |
| **ko** | {n}번 현 (가장 낮음) |
| **ja** | {n}弦（最低音） |
| **zh-Hans** | 第{n}弦（最低） |
| **zh-Hant** | 第{n}弦（最低） |
| **es** | Cuerda {n} (la más grave) |

### `tuning.string.highest`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | String {n} (highest) |
| **ko** | {n}번 현 (가장 높음) |
| **ja** | {n}弦（最高音） |
| **zh-Hans** | 第{n}弦（最高） |
| **zh-Hant** | 第{n}弦（最高） |
| **es** | Cuerda {n} (la más aguda) |

### `tuning.apply`

| | Text |
| --- | --- |
| **en** | Apply custom tuning |
| **ko** | 사용자 튜닝 적용 |
| **ja** | カスタムチューニングを適用 |
| **zh-Hans** | 应用自定义调弦 |
| **zh-Hant** | 套用自訂調弦 |
| **es** | Aplicar afinación personalizada |

### `tuning.down`

| | Text |
| --- | --- |
| **en** | All −1 |
| **ko** | 전체 −1 |
| **ja** | 全体 −1 |
| **zh-Hans** | 全部 −1 |
| **zh-Hant** | 全部 −1 |
| **es** | Todas −1 |

### `tuning.up`

| | Text |
| --- | --- |
| **en** | All +1 |
| **ko** | 전체 +1 |
| **ja** | 全体 +1 |
| **zh-Hans** | 全部 +1 |
| **zh-Hant** | 全部 +1 |
| **es** | Todas +1 |

### `tuning.down.help`

| | Text |
| --- | --- |
| **en** | Lower every string a semitone |
| **ko** | 모든 현을 반음 내립니다 |
| **ja** | すべての弦を半音下げます |
| **zh-Hans** | 所有弦降低半音 |
| **zh-Hant** | 所有弦降低半音 |
| **es** | Baja todas las cuerdas un semitono |

### `tuning.up.help`

| | Text |
| --- | --- |
| **en** | Raise every string a semitone |
| **ko** | 모든 현을 반음 올립니다 |
| **ja** | すべての弦を半音上げます |
| **zh-Hans** | 所有弦升高半音 |
| **zh-Hant** | 所有弦升高半音 |
| **es** | Sube todas las cuerdas un semitono |

### `tuning.reset`

| | Text |
| --- | --- |
| **en** | Reset |
| **ko** | 되돌리기 |
| **ja** | 元に戻す |
| **zh-Hans** | 还原 |
| **zh-Hant** | 還原 |
| **es** | Restablecer |

### `tuning.invalidNote`

| | Text |
| --- | --- |
| **en** | Use a note name with an octave, such as E2 or Bb1. |
| **ko** | E2, Bb1처럼 옥타브를 포함한 음 이름을 적어 주세요. |
| **ja** | E2 や Bb1 のように、オクターブ付きの音名を入力してください。 |
| **zh-Hans** | 请填写带八度的音名，例如 E2 或 Bb1。 |
| **zh-Hant** | 請填入含八度的音名，例如 E2 或 Bb1。 |
| **es** | Usa un nombre de nota con octava, como E2 o Bb1. |

### `tuning.wrongCount`

Placeholders: `{expected}`, `{got}`

| | Text |
| --- | --- |
| **en** | This instrument has {expected} strings but {got} were given. |
| **ko** | 이 악기는 현이 {expected}개인데 {got}개가 입력되었습니다. |
| **ja** | この楽器は{expected}弦ですが、{got}個入力されています。 |
| **zh-Hans** | 这件乐器有 {expected} 根弦，但填写了 {got} 个。 |
| **zh-Hant** | 這件樂器有 {expected} 條弦，但填了 {got} 個。 |
| **es** | Este instrumento tiene {expected} cuerdas, pero se han indicado {got}. |

### `tuning.someInvalid`

| | Text |
| --- | --- |
| **en** | One or more strings are not valid note names. |
| **ko** | 올바른 음 이름이 아닌 현이 있습니다. |
| **ja** | 音名として正しくない弦があります。 |
| **zh-Hans** | 有弦填写的不是有效音名。 |
| **zh-Hant** | 有弦填的不是有效的音名。 |
| **es** | Una o más cuerdas no son nombres de nota válidos. |

### `tuning.name.custom`

Placeholders: `{notes}`

| | Text |
| --- | --- |
| **en** | Custom — {notes} |
| **ko** | 사용자 — {notes} |
| **ja** | カスタム — {notes} |
| **zh-Hans** | 自定义 — {notes} |
| **zh-Hant** | 自訂 — {notes} |
| **es** | Personalizada — {notes} |

## Scale chooser

*The scale / mode card, shown in Scale mode.*

### `scale.title`

| | Text |
| --- | --- |
| **en** | Scale / mode |
| **ko** | 스케일 / 모드 |
| **ja** | スケール / モード |
| **zh-Hans** | 音阶 / 调式 |
| **zh-Hant** | 音階 / 調式 |
| **es** | Escala / modo |

### `scale.root`

| | Text |
| --- | --- |
| **en** | Root note |
| **ko** | 으뜸음 |
| **ja** | ルート音 |
| **zh-Hans** | 主音 |
| **zh-Hant** | 主音 |
| **es** | Nota fundamental |

### `scale.root.help`

| | Text |
| --- | --- |
| **en** | The root also decides the spelling: pick Bb for flat keys, F# for sharp keys. |
| **ko** | 으뜸음이 표기법도 정합니다. 플랫 조성이면 Bb를, 샤프 조성이면 F#을 고르세요. |
| **ja** | ルート音は表記も決めます。フラット系なら Bb、シャープ系なら F# を選んでください。 |
| **zh-Hans** | 主音同时决定记谱方式：降号调选 Bb，升号调选 F#。 |
| **zh-Hant** | 主音同時決定記譜方式：降記號調選 Bb，升記號調選 F#。 |
| **es** | La fundamental decide también la escritura: elige Bb para tonalidades con bemoles y F# para las de sostenidos. |

### `scale.which`

| | Text |
| --- | --- |
| **en** | Scale or mode |
| **ko** | 스케일 또는 모드 |
| **ja** | スケールまたはモード |
| **zh-Hans** | 音阶或调式 |
| **zh-Hant** | 音階或調式 |
| **es** | Escala o modo |

## Chord chooser

*The chord card, shown in Chord mode.*

### `chord.title`

| | Text |
| --- | --- |
| **en** | Chord |
| **ko** | 코드 |
| **ja** | コード |
| **zh-Hans** | 和弦 |
| **zh-Hant** | 和弦 |
| **es** | Acorde |

### `chord.root`

| | Text |
| --- | --- |
| **en** | Root note |
| **ko** | 근음 |
| **ja** | ルート音 |
| **zh-Hans** | 根音 |
| **zh-Hant** | 根音 |
| **es** | Nota fundamental |

### `chord.type`

| | Text |
| --- | --- |
| **en** | Chord type |
| **ko** | 코드 종류 |
| **ja** | コードの種類 |
| **zh-Hans** | 和弦类型 |
| **zh-Hant** | 和弦類型 |
| **es** | Tipo de acorde |

### `chord.fitting`

Placeholders: `{chord}`

| | Text |
| --- | --- |
| **en** | Scales that fit {chord} |
| **ko** | {chord}에 맞는 스케일 |
| **ja** | {chord} に合うスケール |
| **zh-Hans** | 适合 {chord} 的音阶 |
| **zh-Hant** | 適合 {chord} 的音階 |
| **es** | Escalas que encajan con {chord} |

### `chord.fitting.help`

| | Text |
| --- | --- |
| **en** | A chord is the few notes you fret together. A scale is the larger pool of notes you can solo with over it. These scales contain every note of the chord. |
| **ko** | 코드는 함께 짚어 울리는 몇 개의 음이고, 스케일은 그 위에서 솔로할 수 있는 더 넓은 음의 모음입니다. 아래 스케일들은 이 코드의 구성음을 모두 포함합니다. |
| **ja** | コードは同時に押さえて鳴らす数音、スケールはその上でソロに使える広い音の集まりです。ここに挙げたスケールはコードの構成音をすべて含みます。 |
| **zh-Hans** | 和弦是同时按响的少数几个音，音阶则是可以在其上即兴的更大音群。下列音阶包含该和弦的全部音。 |
| **zh-Hant** | 和弦是同時按響的少數幾個音，音階則是能在其上即興的更大音群。下列音階包含該和弦的全部音。 |
| **es** | Un acorde son las pocas notas que pisas a la vez. Una escala es el conjunto más amplio de notas con el que puedes improvisar encima. Estas escalas contienen todas las notas del acorde. |

### `chord.fitting.none`

| | Text |
| --- | --- |
| **en** | No catalogued scale contains every note of this chord. Use chord mode to see its tones on the fretboard instead. |
| **ko** | 이 코드의 구성음을 모두 포함하는 스케일이 목록에 없습니다. 대신 코드 모드에서 구성음을 지판으로 확인하세요. |
| **ja** | このコードの構成音をすべて含むスケールは一覧にありません。代わりにコードモードで指板上の構成音を確認してください。 |
| **zh-Hans** | 目录里没有音阶能包含这个和弦的全部音。可改用和弦模式，在指板上查看它的组成音。 |
| **zh-Hant** | 目錄中沒有音階能包含這個和弦的全部音。可改用和弦模式，在指板上查看它的組成音。 |
| **es** | Ninguna escala del catálogo contiene todas las notas de este acorde. Usa el modo de acordes para ver sus notas en el diapasón. |

### `chord.fitting.hint`

Placeholders: `{root}`

| | Text |
| --- | --- |
| **en** | Picking one switches the fretboard to that scale, rooted on {root}. |
| **ko** | 하나를 고르면 지판이 {root}을(를) 으뜸음으로 한 스케일로 바뀝니다. |
| **ja** | 選ぶと、指板が {root} をルートとするスケール表示に切り替わります。 |
| **zh-Hans** | 选择其一，指板会切换为以 {root} 为主音的该音阶。 |
| **zh-Hant** | 選擇其一，指板會切換成以 {root} 為主音的該音階。 |
| **es** | Al elegir una, el diapasón pasa a mostrar esa escala con fundamental en {root}. |

### `chord.overlay`

| | Text |
| --- | --- |
| **en** | Dim the scale behind chord shapes |
| **ko** | 코드 폼 뒤에 스케일을 흐리게 표시 |
| **ja** | コードフォームの背後にスケールを薄く表示 |
| **zh-Hans** | 在和弦指型后淡淡显示音阶 |
| **zh-Hant** | 在和弦指型後方淡淡顯示音階 |
| **es** | Atenuar la escala detrás de las posiciones de acorde |

### `chord.overlay.help`

| | Text |
| --- | --- |
| **en** | Shows the selected scale faintly underneath the chord shape so you can see how they relate. |
| **ko** | 선택한 스케일을 코드 폼 아래에 옅게 겹쳐 둘의 관계를 볼 수 있게 합니다. |
| **ja** | 選んだスケールをコードフォームの下に薄く重ね、両者の関係が見えるようにします。 |
| **zh-Hans** | 把所选音阶淡淡叠在和弦指型下方，便于看出两者的关系。 |
| **zh-Hant** | 把所選音階淡淡疊在和弦指型下方，方便看出兩者的關係。 |
| **es** | Muestra la escala elegida tenue bajo la posición del acorde para ver cómo se relacionan. |

### `chord.showOnFretboard`

| | Text |
| --- | --- |
| **en** | Show on fretboard |
| **ko** | 지판에 표시 |
| **ja** | 指板に表示 |
| **zh-Hans** | 在指板上显示 |
| **zh-Hant** | 在指板上顯示 |
| **es** | Mostrar en el diapasón |

### `chord.showShapes`

| | Text |
| --- | --- |
| **en** | Show shapes |
| **ko** | 폼 보기 |
| **ja** | フォームを表示 |
| **zh-Hans** | 显示指型 |
| **zh-Hant** | 顯示指型 |
| **es** | Mostrar posiciones |

## Sound and display

*The sound and display card, and audio messages.*

### `audio.title`

| | Text |
| --- | --- |
| **en** | Sound & display |
| **ko** | 소리와 표시 |
| **ja** | 音と表示 |
| **zh-Hans** | 声音与显示 |
| **zh-Hant** | 聲音與顯示 |
| **es** | Sonido y visualización |

### `audio.problem`

| | Text |
| --- | --- |
| **en** | Audio problem |
| **ko** | 소리 문제 |
| **ja** | 音の問題 |
| **zh-Hans** | 声音问题 |
| **zh-Hant** | 聲音問題 |
| **es** | Problema de sonido |

### `audio.volume`

| | Text |
| --- | --- |
| **en** | Volume |
| **ko** | 음량 |
| **ja** | 音量 |
| **zh-Hans** | 音量 |
| **zh-Hant** | 音量 |
| **es** | Volumen |

### `audio.a4`

| | Text |
| --- | --- |
| **en** | Reference pitch |
| **ko** | 기준음 |
| **ja** | 基準ピッチ |
| **zh-Hans** | 基准音高 |
| **zh-Hant** | 基準音高 |
| **es** | Diapasón de referencia |

### `audio.a4.value`

Placeholders: `{hz}`

| | Text |
| --- | --- |
| **en** | A4 = {hz} Hz |
| **ko** | A4 = {hz} Hz |
| **ja** | A4 = {hz} Hz |
| **zh-Hans** | A4 = {hz} Hz |
| **zh-Hant** | A4 = {hz} Hz |
| **es** | La4 = {hz} Hz |

### `audio.a4.help`

| | Text |
| --- | --- |
| **en** | Concert pitch. Everything follows it: the notes you play, the tuner's targets and the frequencies shown. 440 Hz is standard; 432 and 415 Hz are also used. |
| **ko** | 기준 피치입니다. 연주되는 음, 튜너의 목표음, 표시되는 주파수가 모두 이 값을 따릅니다. 440Hz가 표준이며 432Hz와 415Hz도 쓰입니다. |
| **ja** | 基準となるピッチです。鳴る音、チューナーの目標音、表示される周波数がすべてこれに従います。440Hz が標準で、432Hz や 415Hz も使われます。 |
| **zh-Hans** | 基准音高。弹出的音、调音器的目标音与显示的频率都随它变化。440 Hz 为标准，432 与 415 Hz 也有人使用。 |
| **zh-Hant** | 基準音高。彈出的音、調音器的目標音與顯示的頻率都隨它改變。440 Hz 為標準，432 與 415 Hz 也有人使用。 |
| **es** | Afinación de referencia. Todo la sigue: las notas que tocas, los objetivos del afinador y las frecuencias mostradas. 440 Hz es lo estándar; también se usan 432 y 415 Hz. |

### `audio.zoom`

| | Text |
| --- | --- |
| **en** | Fretboard zoom |
| **ko** | 지판 확대 |
| **ja** | 指板の拡大 |
| **zh-Hans** | 指板缩放 |
| **zh-Hant** | 指板縮放 |
| **es** | Zoom del diapasón |

### `audio.zoom.help`

| | Text |
| --- | --- |
| **en** | You can also pinch on a touch screen, or hold Ctrl and scroll. |
| **ko** | 터치 화면에서는 두 손가락으로, 마우스로는 Ctrl을 누른 채 스크롤해도 됩니다. |
| **ja** | タッチ画面ではピンチ、マウスでは Ctrl を押しながらスクロールでも拡大できます。 |
| **zh-Hans** | 触屏可双指缩放，鼠标可按住 Ctrl 滚动。 |
| **zh-Hant** | 觸控螢幕可用雙指縮放，滑鼠可按住 Ctrl 捲動。 |
| **es** | También puedes pellizcar en una pantalla táctil, o mantener Ctrl y desplazar. |

### `audio.labels`

| | Text |
| --- | --- |
| **en** | Show note labels |
| **ko** | 음 이름 표시 |
| **ja** | 音名を表示 |
| **zh-Hans** | 显示音名 |
| **zh-Hant** | 顯示音名 |
| **es** | Mostrar nombres de nota |

### `audio.labels.help`

| | Text |
| --- | --- |
| **en** | Turns the text inside each marker on or off. Marker shape and colour stay. |
| **ko** | 표시 안의 글자를 켜고 끕니다. 모양과 색은 그대로 유지됩니다. |
| **ja** | 各マーカー内の文字を切り替えます。形と色はそのままです。 |
| **zh-Hans** | 开关标记内的文字，形状和颜色保持不变。 |
| **zh-Hant** | 切換標記內的文字，形狀與顏色維持不變。 |
| **es** | Activa o desactiva el texto dentro de cada marca. La forma y el color no cambian. |

### `audio.labelStyle`

| | Text |
| --- | --- |
| **en** | Label style |
| **ko** | 표시 방식 |
| **ja** | 表示の種類 |
| **zh-Hans** | 标注方式 |
| **zh-Hant** | 標示方式 |
| **es** | Estilo de etiqueta |

### `audio.labelStyle.note`

| | Text |
| --- | --- |
| **en** | Note names |
| **ko** | 음 이름 |
| **ja** | 音名 |
| **zh-Hans** | 音名 |
| **zh-Hant** | 音名 |
| **es** | Nombres de nota |

### `audio.labelStyle.degree`

| | Text |
| --- | --- |
| **en** | Degrees |
| **ko** | 음도 |
| **ja** | 度数 |
| **zh-Hans** | 级数 |
| **zh-Hant** | 級數 |
| **es** | Grados |

### `audio.labelStyle.note.help`

| | Text |
| --- | --- |
| **en** | E, F#, G… |
| **ko** | E, F#, G… |
| **ja** | E, F#, G… |
| **zh-Hans** | E、F#、G… |
| **zh-Hant** | E、F#、G… |
| **es** | E, F#, G… |

### `audio.labelStyle.degree.help`

| | Text |
| --- | --- |
| **en** | 1, ♭3, 5… |
| **ko** | 1, ♭3, 5… |
| **ja** | 1, ♭3, 5… |
| **zh-Hans** | 1、♭3、5… |
| **zh-Hant** | 1、♭3、5… |
| **es** | 1, ♭3, 5… |

### `audio.showOutside`

| | Text |
| --- | --- |
| **en** | Show notes outside the scale |
| **ko** | 스케일 밖의 음도 표시 |
| **ja** | スケール外の音も表示 |
| **zh-Hans** | 显示音阶之外的音 |
| **zh-Hant** | 顯示音階之外的音 |
| **es** | Mostrar notas fuera de la escala |

### `audio.showOutside.help`

| | Text |
| --- | --- |
| **en** | Keeps the remaining positions faintly visible so you can still click them. |
| **ko** | 나머지 자리를 흐리게 남겨 두어 눌러 볼 수 있게 합니다. |
| **ja** | 残りの位置を薄く残し、押せるようにします。 |
| **zh-Hans** | 把其余位置淡淡保留，仍可点按。 |
| **zh-Hant** | 把其餘位置淡淡保留，仍可點按。 |
| **es** | Mantiene el resto de posiciones tenuemente visibles para que puedas pulsarlas. |

### `audio.stop`

| | Text |
| --- | --- |
| **en** | Stop all sound |
| **ko** | 소리 모두 멈추기 |
| **ja** | すべての音を止める |
| **zh-Hans** | 停止所有声音 |
| **zh-Hant** | 停止所有聲音 |
| **es** | Detener todo el sonido |

### `audio.reset`

| | Text |
| --- | --- |
| **en** | Reset settings |
| **ko** | 설정 초기화 |
| **ja** | 設定をリセット |
| **zh-Hans** | 重置设置 |
| **zh-Hant** | 重設設定 |
| **es** | Restablecer ajustes |

### `audio.reset.confirm`

| | Text |
| --- | --- |
| **en** | Reset every FretLab setting to its default? |
| **ko** | FretLab의 모든 설정을 기본값으로 되돌릴까요? |
| **ja** | FretLab の設定をすべて初期値に戻しますか？ |
| **zh-Hans** | 要把 FretLab 的所有设置恢复为默认值吗？ |
| **zh-Hant** | 要把 FretLab 的所有設定恢復成預設值嗎？ |
| **es** | ¿Restablecer todos los ajustes de FretLab a sus valores por defecto? |

### `audio.persist.yes`

| | Text |
| --- | --- |
| **en** | Your instrument, tuning, scale, theme and audio settings are remembered in this browser. No account, no server. |
| **ko** | 악기, 튜닝, 스케일, 테마, 소리 설정이 이 브라우저에 저장됩니다. 계정도 서버도 필요 없습니다. |
| **ja** | 楽器・チューニング・スケール・テーマ・音の設定がこのブラウザに保存されます。アカウントもサーバーも不要です。 |
| **zh-Hans** | 乐器、调弦、音阶、主题与声音设置都保存在这个浏览器里。无需账号，也不需要服务器。 |
| **zh-Hant** | 樂器、調弦、音階、主題與聲音設定都儲存在這個瀏覽器裡。不需帳號，也不需伺服器。 |
| **es** | Tu instrumento, afinación, escala, tema y ajustes de sonido se recuerdan en este navegador. Sin cuenta y sin servidor. |

### `audio.persist.no`

| | Text |
| --- | --- |
| **en** | This browser is blocking local storage, so settings will reset when you reload. |
| **ko** | 이 브라우저가 로컬 저장소를 막고 있어 새로 고치면 설정이 초기화됩니다. |
| **ja** | このブラウザはローカルストレージを無効にしているため、再読み込みすると設定が初期化されます。 |
| **zh-Hans** | 这个浏览器禁用了本地存储，刷新后设置会恢复默认。 |
| **zh-Hant** | 這個瀏覽器停用了本機儲存空間，重新整理後設定會回到預設值。 |
| **es** | Este navegador bloquea el almacenamiento local, así que los ajustes se perderán al recargar. |

### `audio.firstClick.title`

| | Text |
| --- | --- |
| **en** | Sound starts on your first click |
| **ko** | 처음 누를 때 소리가 켜집니다 |
| **ja** | 最初のクリックで音が有効になります |
| **zh-Hans** | 首次点击时才会开声 |
| **zh-Hant** | 第一次點按時才會開聲 |
| **es** | El sonido empieza con tu primera pulsación |

### `audio.firstClick.body`

| | Text |
| --- | --- |
| **en** | Browsers only allow audio after a real interaction, so the first position you click also starts the audio engine. Everything is synthesised in the page — there are no audio files to download. |
| **ko** | 브라우저는 실제 조작이 있어야 소리를 허용하므로, 처음 누르는 위치에서 사운드 엔진이 함께 켜집니다. 모든 소리는 페이지 안에서 합성되며 내려받는 음원 파일은 없습니다. |
| **ja** | ブラウザは実際の操作があってはじめて音を許可するため、最初に押した位置でサウンドエンジンも起動します。音はすべてページ内で合成され、ダウンロードする音源ファイルはありません。 |
| **zh-Hans** | 浏览器只在真实操作之后才允许播放声音，因此你点按的第一个位置也会启动声音引擎。所有声音都在页面内合成，无需下载音频文件。 |
| **zh-Hant** | 瀏覽器只在真實操作之後才允許播放聲音，因此你點按的第一個位置也會啟動聲音引擎。所有聲音都在頁面內合成，不需下載音訊檔。 |
| **es** | Los navegadores solo permiten el audio tras una interacción real, así que la primera posición que pulses también arranca el motor de sonido. Todo se sintetiza en la página: no hay archivos de audio que descargar. |

### `audio.err.unsupported`

| | Text |
| --- | --- |
| **en** | This browser does not support the Web Audio API, so playback is unavailable. |
| **ko** | 이 브라우저는 Web Audio API를 지원하지 않아 소리를 낼 수 없습니다. |
| **ja** | このブラウザは Web Audio API に対応していないため、音を鳴らせません。 |
| **zh-Hans** | 此浏览器不支持 Web Audio API，无法播放声音。 |
| **zh-Hant** | 這個瀏覽器不支援 Web Audio API，無法播放聲音。 |
| **es** | Este navegador no admite la Web Audio API, así que no hay reproducción. |

### `audio.err.init`

Placeholders: `{reason}`

| | Text |
| --- | --- |
| **en** | Audio could not be initialised: {reason} |
| **ko** | 오디오를 초기화할 수 없습니다: {reason} |
| **ja** | オーディオを初期化できませんでした: {reason} |
| **zh-Hans** | 音频初始化失败：{reason} |
| **zh-Hant** | 音訊初始化失敗：{reason} |
| **es** | No se pudo inicializar el audio: {reason} |

### `audio.err.playback`

Placeholders: `{reason}`

| | Text |
| --- | --- |
| **en** | Playback failed: {reason} |
| **ko** | 재생에 실패했습니다: {reason} |
| **ja** | 再生に失敗しました: {reason} |
| **zh-Hans** | 播放失败：{reason} |
| **zh-Hant** | 播放失敗：{reason} |
| **es** | Fallo en la reproducción: {reason} |

## Current selection

*The information panel under the instrument.*

### `info.title`

| | Text |
| --- | --- |
| **en** | Current selection |
| **ko** | 현재 선택 |
| **ja** | 現在の選択 |
| **zh-Hans** | 当前选择 |
| **zh-Hant** | 目前選擇 |
| **es** | Selección actual |

### `info.note`

| | Text |
| --- | --- |
| **en** | Selected note |
| **ko** | 선택한 음 |
| **ja** | 選択した音 |
| **zh-Hans** | 所选音 |
| **zh-Hant** | 所選音 |
| **es** | Nota seleccionada |

### `info.note.hint`

| | Text |
| --- | --- |
| **en** | Click or tap anywhere on the fretboard to hear a note. |
| **ko** | 지판 아무 곳이나 누르면 그 음을 들을 수 있습니다. |
| **ja** | 指板のどこかを押すと、その音が鳴ります。 |
| **zh-Hans** | 点按指板上任意位置即可听到该音。 |
| **zh-Hant** | 點按指板上任一位置即可聽見該音。 |
| **es** | Pulsa en cualquier punto del diapasón para oír una nota. |

### `info.note.detail`

Placeholders: `{string}`, `{fret}`, `{freq}`, `{midi}`

| | Text |
| --- | --- |
| **en** | String {string} · {fret} · {freq} Hz · MIDI {midi} |
| **ko** | {string}번 현 · {fret} · {freq} Hz · MIDI {midi} |
| **ja** | {string}弦 · {fret} · {freq} Hz · MIDI {midi} |
| **zh-Hans** | 第{string}弦 · {fret} · {freq} Hz · MIDI {midi} |
| **zh-Hant** | 第{string}弦 · {fret} · {freq} Hz · MIDI {midi} |
| **es** | Cuerda {string} · {fret} · {freq} Hz · MIDI {midi} |

### `info.open`

| | Text |
| --- | --- |
| **en** | open |
| **ko** | 개방현 |
| **ja** | 開放弦 |
| **zh-Hans** | 空弦 |
| **zh-Hant** | 空弦 |
| **es** | al aire |

### `info.fret`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | fret {n} |
| **ko** | {n}프렛 |
| **ja** | {n}フレット |
| **zh-Hans** | 第{n}品 |
| **zh-Hant** | 第{n}格 |
| **es** | traste {n} |

### `info.scale`

| | Text |
| --- | --- |
| **en** | Selected scale |
| **ko** | 선택한 스케일 |
| **ja** | 選択したスケール |
| **zh-Hans** | 所选音阶 |
| **zh-Hant** | 所選音階 |
| **es** | Escala seleccionada |

### `info.scale.notes`

| | Text |
| --- | --- |
| **en** | Notes of the scale |
| **ko** | 스케일 구성음 |
| **ja** | スケールの構成音 |
| **zh-Hans** | 音阶组成音 |
| **zh-Hant** | 音階組成音 |
| **es** | Notas de la escala |

### `info.scale.detail`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | {n} notes · a pool to play over the chord |
| **ko** | {n}개 음 · 코드 위에서 연주할 음의 모음 |
| **ja** | {n}音 · コードの上で使う音の集まり |
| **zh-Hans** | {n} 个音 · 可在和弦上使用的音群 |
| **zh-Hant** | {n} 個音 · 可在和弦上使用的音群 |
| **es** | {n} notas · un conjunto para tocar sobre el acorde |

### `info.scale.shown`

| | Text |
| --- | --- |
| **en** | shown on the fretboard |
| **ko** | 지판에 표시 중 |
| **ja** | 指板に表示中 |
| **zh-Hans** | 已显示在指板上 |
| **zh-Hant** | 已顯示在指板上 |
| **es** | mostrada en el diapasón |

### `info.chord`

| | Text |
| --- | --- |
| **en** | Selected chord |
| **ko** | 선택한 코드 |
| **ja** | 選択したコード |
| **zh-Hans** | 所选和弦 |
| **zh-Hant** | 所選和弦 |
| **es** | Acorde seleccionado |

### `info.chord.notes`

| | Text |
| --- | --- |
| **en** | Notes of the chord |
| **ko** | 코드 구성음 |
| **ja** | コードの構成音 |
| **zh-Hans** | 和弦组成音 |
| **zh-Hant** | 和弦組成音 |
| **es** | Notas del acorde |

### `info.chord.detail`

Placeholders: `{name}`, `{n}`

| | Text |
| --- | --- |
| **en** | {name} · {n} notes played together |
| **ko** | {name} · 함께 울리는 {n}개 음 |
| **ja** | {name} · 同時に鳴らす{n}音 |
| **zh-Hans** | {name} · 同时发声的 {n} 个音 |
| **zh-Hant** | {name} · 同時發聲的 {n} 個音 |
| **es** | {name} · {n} notas tocadas a la vez |

### `info.chord.shown`

| | Text |
| --- | --- |
| **en** | shapes shown on the fretboard |
| **ko** | 지판에 폼 표시 중 |
| **ja** | 指板にフォームを表示中 |
| **zh-Hans** | 指型已显示在指板上 |
| **zh-Hant** | 指型已顯示在指板上 |
| **es** | posiciones mostradas en el diapasón |

### `info.tuning`

| | Text |
| --- | --- |
| **en** | Tuning |
| **ko** | 튜닝 |
| **ja** | チューニング |
| **zh-Hans** | 调弦 |
| **zh-Hant** | 調弦 |
| **es** | Afinación |

### `legend.label`

| | Text |
| --- | --- |
| **en** | Marker legend |
| **ko** | 표시 기호 설명 |
| **ja** | 記号の凡例 |
| **zh-Hans** | 标记图例 |
| **zh-Hant** | 標記圖例 |
| **es** | Leyenda de marcas |

### `legend.root`

| | Text |
| --- | --- |
| **en** | Root note (square) |
| **ko** | 으뜸음 (사각형) |
| **ja** | ルート音（四角） |
| **zh-Hans** | 主音（方形） |
| **zh-Hant** | 主音（方形） |
| **es** | Fundamental (cuadrado) |

### `legend.scale`

| | Text |
| --- | --- |
| **en** | Scale note (circle) |
| **ko** | 스케일 음 (원) |
| **ja** | スケール音（丸） |
| **zh-Hans** | 音阶音（圆形） |
| **zh-Hant** | 音階音（圓形） |
| **es** | Nota de la escala (círculo) |

### `legend.chord`

| | Text |
| --- | --- |
| **en** | Chord tone |
| **ko** | 코드 구성음 |
| **ja** | コード構成音 |
| **zh-Hans** | 和弦音 |
| **zh-Hant** | 和弦音 |
| **es** | Nota del acorde |

### `legend.selected`

| | Text |
| --- | --- |
| **en** | Last played |
| **ko** | 마지막으로 들은 음 |
| **ja** | 最後に鳴らした音 |
| **zh-Hans** | 最近弹响的音 |
| **zh-Hant** | 最近彈響的音 |
| **es** | Última tocada |

### `legend.faint`

| | Text |
| --- | --- |
| **en** | Faint: outside the scale |
| **ko** | 흐린 표시: 스케일 밖의 음 |
| **ja** | 薄い表示: スケール外の音 |
| **zh-Hans** | 淡色：音阶之外的音 |
| **zh-Hant** | 淡色：音階之外的音 |
| **es** | Tenue: fuera de la escala |

### `legend.muted`

| | Text |
| --- | --- |
| **en** | ✕ at the nut: muted string |
| **ko** | 너트의 ✕: 뮤트한 현 |
| **ja** | ナットの ✕: ミュートする弦 |
| **zh-Hans** | 弦枕处的 ✕：闷掉的弦 |
| **zh-Hant** | 弦枕處的 ✕：悶掉的弦 |
| **es** | ✕ en la cejuela: cuerda apagada |

## Chord shapes

*The chord shapes panel, shown in Chord mode.*

### `chords.title`

Placeholders: `{chord}`

| | Text |
| --- | --- |
| **en** | Chord — {chord} |
| **ko** | 코드 — {chord} |
| **ja** | コード — {chord} |
| **zh-Hans** | 和弦 — {chord} |
| **zh-Hant** | 和弦 — {chord} |
| **es** | Acorde — {chord} |

### `chords.none.title`

| | Text |
| --- | --- |
| **en** | No playable shape in this tuning |
| **ko** | 이 튜닝에서는 짚을 수 있는 폼이 없습니다 |
| **ja** | このチューニングでは押さえられるフォームがありません |
| **zh-Hans** | 这种调弦下没有可按的指型 |
| **zh-Hant** | 這種調弦下沒有按得出來的指型 |
| **es** | No hay ninguna posición tocable en esta afinación |

### `chords.none.body`

Placeholders: `{chord}`, `{instrument}`, `{tuning}`

| | Text |
| --- | --- |
| **en** | {chord} cannot be fingered on {instrument} tuned {tuning} within a four-fret stretch. Try a different chord type, a different root, or another tuning — rather than showing you a shape that would sound like something else. |
| **ko** | {tuning}(으)로 조율한 {instrument}에서는 네 프렛 범위 안에 {chord}을(를) 짚을 수 없습니다. 다른 소리가 날 폼을 보여 주는 대신, 코드 종류나 근음 또는 튜닝을 바꿔 보세요. |
| **ja** | {tuning} にした{instrument}では、4フレットの範囲で {chord} を押さえられません。別の音に聞こえるフォームを見せる代わりに、コードの種類やルート、チューニングを変えてみてください。 |
| **zh-Hans** | 在调为 {tuning} 的{instrument}上，四品跨度内按不出 {chord}。与其给出一个听起来是别的和弦的指型，不如换一种和弦类型、换个根音或换一种调弦。 |
| **zh-Hant** | 在調成 {tuning} 的{instrument}上，四格跨度內按不出 {chord}。與其給出一個聽起來是別的和弦的指型，不如換個和弦類型、換個根音，或換一種調弦。 |
| **es** | {chord} no se puede pisar en {instrument} afinado {tuning} dentro de cuatro trastes. Prueba otro tipo de acorde, otra fundamental u otra afinación, en vez de mostrarte una posición que sonaría a otra cosa. |

### `chords.found`

Placeholders: `{n}`, `{chord}`, `{tuning}`

| | Text |
| --- | --- |
| **en** | {n} shapes found for {chord} in {tuning}. Numbers are fret numbers; ✕ means do not play that string. |
| en, *when 1* | 1 shape found for {chord} in {tuning}. Numbers are fret numbers; ✕ means do not play that string. |
| **ko** | {tuning} 튜닝에서 {chord} 폼을 {n}개 찾았습니다. 숫자는 프렛 번호이고, ✕는 그 현을 울리지 않는다는 뜻입니다. |
| **ja** | {tuning} のチューニングで {chord} のフォームが{n}個見つかりました。数字はフレット番号、✕ はその弦を鳴らさないという意味です。 |
| **zh-Hans** | 在 {tuning} 调弦下为 {chord} 找到 {n} 个指型。数字是品位，✕ 表示该弦不弹。 |
| **zh-Hant** | 在 {tuning} 調弦下為 {chord} 找到 {n} 個指型。數字是格數，✕ 表示該弦不彈。 |
| **es** | Se han encontrado {n} posiciones de {chord} en {tuning}. Los números son trastes; ✕ significa no tocar esa cuerda. |
| es, *when 1* | Se ha encontrado 1 posición de {chord} en {tuning}. Los números son trastes; ✕ significa no tocar esa cuerda. |

### `chords.shapes`

| | Text |
| --- | --- |
| **en** | Chord shapes |
| **ko** | 코드 폼 |
| **ja** | コードフォーム |
| **zh-Hans** | 和弦指型 |
| **zh-Hant** | 和弦指型 |
| **es** | Posiciones de acorde |

### `chords.barre`

Placeholders: `{fret}`

| | Text |
| --- | --- |
| **en** | barre {fret} |
| **ko** | {fret}프렛 바레 |
| **ja** | {fret}フレット・バレー |
| **zh-Hans** | {fret}品横按 |
| **zh-Hant** | {fret}格封閉 |
| **es** | cejilla {fret} |

### `chords.noBarre`

Placeholders: `{chord}`

| | Text |
| --- | --- |
| **en** | No barre shape exists for {chord} in this tuning: a barre needs two chord tones at the same fret on different strings, and this chord's intervals never line up that way here. |
| **ko** | 이 튜닝에서 {chord}에는 바레 폼이 없습니다. 바레가 되려면 서로 다른 현의 같은 프렛에 구성음이 두 개 있어야 하는데, 이 코드의 음정은 여기서 그렇게 맞아떨어지지 않습니다. |
| **ja** | このチューニングでは {chord} にバレーフォームがありません。バレーには別々の弦の同じフレットに構成音が2つ必要ですが、このコードの音程はここではそう並びません。 |
| **zh-Hans** | 这种调弦下 {chord} 没有横按指型：横按需要不同弦的同一品上有两个和弦音，而这个和弦的音程在此排不出这样的组合。 |
| **zh-Hant** | 這種調弦下 {chord} 沒有封閉指型：封閉需要不同弦的同一格上有兩個和弦音，而這個和弦的音程在此排不出這樣的組合。 |
| **es** | No existe posición con cejilla para {chord} en esta afinación: una cejilla necesita dos notas del acorde en el mismo traste de cuerdas distintas, y los intervalos de este acorde nunca coinciden así aquí. |

### `chords.sounds`

| | Text |
| --- | --- |
| **en** | This shape actually sounds |
| **ko** | 이 폼에서 실제로 울리는 음 |
| **ja** | このフォームで実際に鳴る音 |
| **zh-Hans** | 这个指型实际发出的音 |
| **zh-Hant** | 這個指型實際發出的音 |
| **es** | Esta posición suena realmente |

### `chords.sounds.help`

| | Text |
| --- | --- |
| **en** | Computed from the current tuning, not assumed from a standard-tuning shape. |
| **ko** | 표준 튜닝 폼을 가정하지 않고 현재 튜닝에서 계산한 값입니다. |
| **ja** | レギュラーチューニングのフォームを前提にせず、現在のチューニングから計算しています。 |
| **zh-Hans** | 按当前调弦算出，而非沿用标准调弦的指型。 |
| **zh-Hant** | 依目前調弦算出，而非沿用標準調弦的指型。 |
| **es** | Calculado con la afinación actual, no supuesto a partir de una posición en afinación estándar. |

### `chords.tones`

Placeholders: `{tones}`

| | Text |
| --- | --- |
| **en** | Chord tones: {tones} |
| **ko** | 구성음: {tones} |
| **ja** | 構成音: {tones} |
| **zh-Hans** | 和弦音：{tones} |
| **zh-Hant** | 和弦音：{tones} |
| **es** | Notas del acorde: {tones} |

### `chords.omits`

Placeholders: `{tones}`

| | Text |
| --- | --- |
| **en** | omits {tones} (there is no room for every tone in this shape) |
| **ko** | {tones} 생략 (이 폼에는 모든 구성음이 들어갈 자리가 없습니다) |
| **ja** | {tones} を省略（このフォームにはすべての構成音を入れる余地がありません） |
| **zh-Hans** | 省略 {tones}（这个指型放不下全部和弦音） |
| **zh-Hant** | 省略 {tones}（這個指型放不下全部和弦音） |
| **es** | omite {tones} (no caben todas las notas en esta posición) |

### `chords.inverted`

| | Text |
| --- | --- |
| **en** | not in root position: the bass note is not the root |
| **ko** | 자리바꿈: 가장 낮은 음이 근음이 아닙니다 |
| **ja** | 転回形: 最低音がルートではありません |
| **zh-Hans** | 转位：最低音不是根音 |
| **zh-Hant** | 轉位：最低音不是根音 |
| **es** | en inversión: el bajo no es la fundamental |

### `chords.fingers`

Placeholders: `{n}`

| | Text |
| --- | --- |
| **en** | {n} fingers |
| en, *when 1* | 1 finger |
| **ko** | 손가락 {n}개 |
| **ja** | 指{n}本 |
| **zh-Hans** | {n} 根手指 |
| **zh-Hant** | {n} 根手指 |
| **es** | {n} dedos |
| es, *when 1* | 1 dedo |

### `voicing.allOpen`

| | Text |
| --- | --- |
| **en** | All open |
| **ko** | 모두 개방현 |
| **ja** | すべて開放弦 |
| **zh-Hans** | 全空弦 |
| **zh-Hant** | 全空弦 |
| **es** | Todas al aire |

### `voicing.openPosition`

| | Text |
| --- | --- |
| **en** | Open position |
| **ko** | 개방 포지션 |
| **ja** | オープンポジション |
| **zh-Hans** | 开放把位 |
| **zh-Hant** | 開放把位 |
| **es** | Posición abierta |

### `voicing.position`

Placeholders: `{fret}`

| | Text |
| --- | --- |
| **en** | Position {fret} |
| **ko** | {fret}포지션 |
| **ja** | {fret}ポジション |
| **zh-Hans** | 第{fret}把位 |
| **zh-Hant** | 第{fret}把位 |
| **es** | Posición {fret} |

### `voicing.barre`

Placeholders: `{fret}`

| | Text |
| --- | --- |
| **en** | Barre {fret} |
| **ko** | {fret}프렛 바레 |
| **ja** | {fret}フレット・バレー |
| **zh-Hans** | {fret}品横按 |
| **zh-Hant** | {fret}格封閉 |
| **es** | Cejilla {fret} |

### `voicing.power`

Placeholders: `{string}`, `{fret}`

| | Text |
| --- | --- |
| **en** | String {string}, fret {fret} |
| **ko** | {string}번 현, {fret}프렛 |
| **ja** | {string}弦 {fret}フレット |
| **zh-Hans** | 第{string}弦，第{fret}品 |
| **zh-Hant** | 第{string}弦，第{fret}格 |
| **es** | Cuerda {string}, traste {fret} |

## Strumming

*The strumming controls in the chord shapes panel.*

### `strum.play`

| | Text |
| --- | --- |
| **en** | Play the chord |
| **ko** | 코드 들어 보기 |
| **ja** | コードを鳴らす |
| **zh-Hans** | 试听和弦 |
| **zh-Hant** | 試聽和弦 |
| **es** | Tocar el acorde |

### `strum.play.help`

| | Text |
| --- | --- |
| **en** | Down starts from the lowest string and sweeps up; up starts from the highest string and sweeps down. Muted strings stay silent. |
| **ko** | 다운은 가장 낮은 현에서 위로, 업은 가장 높은 현에서 아래로 훑습니다. 뮤트한 현은 소리가 나지 않습니다. |
| **ja** | ダウンは最低音の弦から上へ、アップは最高音の弦から下へ弾きます。ミュートした弦は鳴りません。 |
| **zh-Hans** | 下扫从最低弦往上，上扫从最高弦往下。闷音的弦不发声。 |
| **zh-Hant** | 下刷從最低弦往上，上刷從最高弦往下。悶音的弦不會發聲。 |
| **es** | Hacia abajo empieza por la cuerda más grave y sube; hacia arriba empieza por la más aguda y baja. Las cuerdas apagadas no suenan. |

### `strum.together`

| | Text |
| --- | --- |
| **en** | ▶ Together |
| **ko** | ▶ 동시에 |
| **ja** | ▶ 同時 |
| **zh-Hans** | ▶ 同时 |
| **zh-Hant** | ▶ 同時 |
| **es** | ▶ A la vez |

### `strum.down`

| | Text |
| --- | --- |
| **en** | ↓ Down strum |
| **ko** | ↓ 다운 스트로크 |
| **ja** | ↓ ダウンストローク |
| **zh-Hans** | ↓ 下扫 |
| **zh-Hant** | ↓ 下刷 |
| **es** | ↓ Rasgueo abajo |

### `strum.up`

| | Text |
| --- | --- |
| **en** | ↑ Up strum |
| **ko** | ↑ 업 스트로크 |
| **ja** | ↑ アップストローク |
| **zh-Hans** | ↑ 上扫 |
| **zh-Hant** | ↑ 上刷 |
| **es** | ↑ Rasgueo arriba |

### `strum.direction`

| | Text |
| --- | --- |
| **en** | Default strum direction |
| **ko** | 기본 스트로크 방향 |
| **ja** | 既定のストローク方向 |
| **zh-Hans** | 默认扫弦方向 |
| **zh-Hant** | 預設刷弦方向 |
| **es** | Dirección de rasgueo por defecto |

### `strum.mode.normal`

| | Text |
| --- | --- |
| **en** | Together |
| **ko** | 동시에 |
| **ja** | 同時 |
| **zh-Hans** | 同时 |
| **zh-Hant** | 同時 |
| **es** | A la vez |

### `strum.mode.down`

| | Text |
| --- | --- |
| **en** | Down |
| **ko** | 다운 |
| **ja** | ダウン |
| **zh-Hans** | 下扫 |
| **zh-Hant** | 下刷 |
| **es** | Abajo |

### `strum.mode.up`

| | Text |
| --- | --- |
| **en** | Up |
| **ko** | 업 |
| **ja** | アップ |
| **zh-Hans** | 上扫 |
| **zh-Hant** | 上刷 |
| **es** | Arriba |

### `strum.speed`

| | Text |
| --- | --- |
| **en** | Strum speed |
| **ko** | 스트로크 속도 |
| **ja** | ストロークの速さ |
| **zh-Hans** | 扫弦速度 |
| **zh-Hant** | 刷弦速度 |
| **es** | Velocidad del rasgueo |

### `strum.speed.preset`

| | Text |
| --- | --- |
| **en** | Strum speed preset |
| **ko** | 스트로크 속도 프리셋 |
| **ja** | ストローク速度プリセット |
| **zh-Hans** | 扫弦速度预设 |
| **zh-Hant** | 刷弦速度預設 |
| **es** | Preajuste de velocidad |

### `strum.slow`

| | Text |
| --- | --- |
| **en** | Slow |
| **ko** | 느리게 |
| **ja** | ゆっくり |
| **zh-Hans** | 慢 |
| **zh-Hant** | 慢 |
| **es** | Lento |

### `strum.normal`

| | Text |
| --- | --- |
| **en** | Normal |
| **ko** | 보통 |
| **ja** | ふつう |
| **zh-Hans** | 中 |
| **zh-Hant** | 中 |
| **es** | Normal |

### `strum.fast`

| | Text |
| --- | --- |
| **en** | Fast |
| **ko** | 빠르게 |
| **ja** | 速く |
| **zh-Hans** | 快 |
| **zh-Hant** | 快 |
| **es** | Rápido |

### `strum.custom`

| | Text |
| --- | --- |
| **en** | Custom |
| **ko** | 직접 설정 |
| **ja** | カスタム |
| **zh-Hans** | 自定义 |
| **zh-Hant** | 自訂 |
| **es** | Personalizado |

### `strum.gap`

| | Text |
| --- | --- |
| **en** | Gap between strings |
| **ko** | 현 사이 간격 |
| **ja** | 弦と弦の間隔 |
| **zh-Hans** | 弦与弦的间隔 |
| **zh-Hant** | 弦與弦的間隔 |
| **es** | Intervalo entre cuerdas |

### `strum.gap.help`

Placeholders: `{slow}`, `{normal}`, `{fast}`

| | Text |
| --- | --- |
| **en** | Slow is {slow} ms, normal {normal} ms, fast {fast} ms between adjacent strings. |
| **ko** | 이웃한 현 사이 간격이 느리게는 {slow}ms, 보통은 {normal}ms, 빠르게는 {fast}ms입니다. |
| **ja** | 隣り合う弦の間隔は、ゆっくり {slow}ms、ふつう {normal}ms、速く {fast}ms です。 |
| **zh-Hans** | 相邻弦之间：慢为 {slow} 毫秒，中为 {normal} 毫秒，快为 {fast} 毫秒。 |
| **zh-Hant** | 相鄰弦之間：慢為 {slow} 毫秒，中為 {normal} 毫秒，快為 {fast} 毫秒。 |
| **es** | Entre cuerdas contiguas: lento {slow} ms, normal {normal} ms, rápido {fast} ms. |

### `strum.ms`

Placeholders: `{ms}`

| | Text |
| --- | --- |
| **en** | {ms} ms |
| **ko** | {ms}ms |
| **ja** | {ms}ms |
| **zh-Hans** | {ms} 毫秒 |
| **zh-Hant** | {ms} 毫秒 |
| **es** | {ms} ms |

## Tuner

*The tuner card over the headstock, and its messages.*

### `tuner.title`

| | Text |
| --- | --- |
| **en** | Chromatic tuner |
| **ko** | 크로매틱 튜너 |
| **ja** | クロマチックチューナー |
| **zh-Hans** | 半音调音器 |
| **zh-Hant** | 半音調音器 |
| **es** | Afinador cromático |

### `tuner.listening`

| | Text |
| --- | --- |
| **en** | Listening… |
| **ko** | 듣는 중… |
| **ja** | 聞き取り中… |
| **zh-Hans** | 聆听中… |
| **zh-Hant** | 聆聽中… |
| **es** | Escuchando… |

### `tuner.detected`

| | Text |
| --- | --- |
| **en** | Detected |
| **ko** | 감지된 음 |
| **ja** | 検出 |
| **zh-Hans** | 检测到 |
| **zh-Hant** | 偵測到 |
| **es** | Detectado |

### `tuner.target`

| | Text |
| --- | --- |
| **en** | Target |
| **ko** | 목표 |
| **ja** | 目標 |
| **zh-Hans** | 目标 |
| **zh-Hant** | 目標 |
| **es** | Objetivo |

### `tuner.deviation`

| | Text |
| --- | --- |
| **en** | Deviation |
| **ko** | 오차 |
| **ja** | ずれ |
| **zh-Hans** | 偏差 |
| **zh-Hant** | 偏差 |
| **es** | Desviación |

### `tuner.cents`

Placeholders: `{cents}`

| | Text |
| --- | --- |
| **en** | {cents} cents |
| **ko** | {cents} 센트 |
| **ja** | {cents} セント |
| **zh-Hans** | {cents} 音分 |
| **zh-Hant** | {cents} 音分 |
| **es** | {cents} centésimas |

### `tuner.tuningTo`

| | Text |
| --- | --- |
| **en** | Tuning to |
| **ko** | 맞출 튜닝 |
| **ja** | 合わせるチューニング |
| **zh-Hans** | 调向 |
| **zh-Hant** | 調向 |
| **es** | Afinando a |

### `tuner.pinned`

Placeholders: `{note}`

| | Text |
| --- | --- |
| **en** | Listening for the {note} string only. |
| **ko** | {note} 현만 듣고 있습니다. |
| **ja** | {note} 弦だけを聞いています。 |
| **zh-Hans** | 只聆听 {note} 弦。 |
| **zh-Hant** | 只聆聽 {note} 弦。 |
| **es** | Escuchando solo la cuerda {note}. |

### `tuner.followAny`

| | Text |
| --- | --- |
| **en** | Follow any string |
| **ko** | 모든 현 따라가기 |
| **ja** | すべての弦を対象にする |
| **zh-Hans** | 聆听任意弦 |
| **zh-Hant** | 聆聽任一條弦 |
| **es** | Seguir cualquier cuerda |

### `tuner.playOne`

| | Text |
| --- | --- |
| **en** | Play a single open string |
| **ko** | 개방현 하나를 쳐 보세요 |
| **ja** | 開放弦を1本鳴らしてください |
| **zh-Hans** | 请弹响一根空弦 |
| **zh-Hant** | 請彈響一條空弦 |
| **es** | Toca una sola cuerda al aire |

### `tuner.inTune`

| | Text |
| --- | --- |
| **en** | In tune |
| **ko** | 맞았습니다 |
| **ja** | 合っています |
| **zh-Hans** | 已准 |
| **zh-Hant** | 已準 |
| **es** | Afinada |

### `tuner.flat`

Placeholders: `{cents}`

| | Text |
| --- | --- |
| **en** | ▲ Flat by {cents} cents — tighten the string |
| **ko** | ▲ {cents}센트 낮음 — 현을 조이세요 |
| **ja** | ▲ {cents}セント低い — 弦を締めてください |
| **zh-Hans** | ▲ 偏低 {cents} 音分 — 请拧紧琴弦 |
| **zh-Hant** | ▲ 偏低 {cents} 音分 — 請鎖緊琴弦 |
| **es** | ▲ {cents} centésimas baja — tensa la cuerda |

### `tuner.sharp`

Placeholders: `{cents}`

| | Text |
| --- | --- |
| **en** | ▼ Sharp by {cents} cents — loosen the string |
| **ko** | ▼ {cents}센트 높음 — 현을 푸세요 |
| **ja** | ▼ {cents}セント高い — 弦を緩めてください |
| **zh-Hans** | ▼ 偏高 {cents} 音分 — 请放松琴弦 |
| **zh-Hant** | ▼ 偏高 {cents} 音分 — 請放鬆琴弦 |
| **es** | ▼ {cents} centésimas alta — afloja la cuerda |

### `tuner.wrongString`

Placeholders: `{played}`, `{target}`

| | Text |
| --- | --- |
| **en** | That is {played}, not the {target} string |
| **ko** | {target} 현이 아니라 {played}입니다 |
| **ja** | {target} 弦ではなく {played} です |
| **zh-Hans** | 这是 {played}，不是 {target} 弦 |
| **zh-Hant** | 這是 {played}，不是 {target} 弦 |
| **es** | Eso es {played}, no la cuerda {target} |

### `tuner.targetString`

| | Text |
| --- | --- |
| **en** | Target string |
| **ko** | 목표 현 |
| **ja** | 目標の弦 |
| **zh-Hans** | 目标弦 |
| **zh-Hant** | 目標弦 |
| **es** | Cuerda objetivo |

### `tuner.auto`

| | Text |
| --- | --- |
| **en** | Auto |
| **ko** | 자동 |
| **ja** | 自動 |
| **zh-Hans** | 自动 |
| **zh-Hant** | 自動 |
| **es** | Automático |

### `tuner.auto.help`

| | Text |
| --- | --- |
| **en** | Compare against whichever string is closest |
| **ko** | 가장 가까운 현과 비교합니다 |
| **ja** | いちばん近い弦と比べます |
| **zh-Hans** | 与最接近的那根弦比较 |
| **zh-Hant** | 與最接近的那條弦比較 |
| **es** | Compara con la cuerda más cercana |

### `tuner.string.help`

Placeholders: `{n}`, `{note}`

| | Text |
| --- | --- |
| **en** | String {n}: {note}. Plays the reference pitch, and pins the tuner to this string; click again to follow any string. |
| **ko** | {n}번 현: {note}. 기준음을 들려주고 튜너를 이 현에 고정합니다. 다시 누르면 모든 현을 따라갑니다. |
| **ja** | {n}弦: {note}。基準音を鳴らし、チューナーをこの弦に固定します。もう一度押すとすべての弦を対象にします。 |
| **zh-Hans** | 第{n}弦：{note}。会播放基准音，并把调音器固定到这根弦；再次点击可改回聆听任意弦。 |
| **zh-Hant** | 第{n}弦：{note}。會播放基準音，並把調音器固定到這條弦；再按一次可改回聆聽任一條弦。 |
| **es** | Cuerda {n}: {note}. Suena la nota de referencia y fija el afinador en esta cuerda; púlsala otra vez para seguir cualquier cuerda. |

### `tuner.pinHint`

| | Text |
| --- | --- |
| **en** | Pick a string to pin it as the target and hear its reference pitch, or leave it on Auto. |
| **ko** | 현을 골라 목표로 고정하고 기준음을 듣거나, 자동으로 두어도 됩니다. |
| **ja** | 弦を選んで目標に固定し基準音を聞くか、自動のままでも使えます。 |
| **zh-Hans** | 选一根弦固定为目标并听基准音，也可以留在自动。 |
| **zh-Hant** | 選一條弦固定為目標並聽基準音，也可以保持自動。 |
| **es** | Elige una cuerda para fijarla como objetivo y oír su nota de referencia, o déjalo en Automático. |

### `tuner.pinHint.help`

| | Text |
| --- | --- |
| **en** | The targets come from the tuning selected in the sidebar, so the tuner works for Drop D, Eb standard, a custom tuning and everything else. |
| **ko** | 목표음은 사이드바에서 선택한 튜닝에서 가져오므로 Drop D, Eb 스탠다드, 사용자 튜닝에서도 그대로 동작합니다. |
| **ja** | 目標音はサイドバーで選んだチューニングから取るため、Drop D や Eb スタンダード、カスタムチューニングでもそのまま使えます。 |
| **zh-Hans** | 目标音取自侧栏选定的调弦，因此 Drop D、Eb 标准以及自定义调弦都同样适用。 |
| **zh-Hant** | 目標音取自側邊欄選定的調弦，因此 Drop D、Eb 標準以及自訂調弦都同樣適用。 |
| **es** | Los objetivos vienen de la afinación elegida en el panel lateral, así que el afinador funciona con Drop D, Eb estándar, una afinación personalizada y cualquier otra. |

### `tuner.close`

| | Text |
| --- | --- |
| **en** | Close tuner |
| **ko** | 튜너 닫기 |
| **ja** | チューナーを閉じる |
| **zh-Hans** | 关闭调音器 |
| **zh-Hant** | 關閉調音器 |
| **es** | Cerrar el afinador |

### `tuner.meter.noSignal`

| | Text |
| --- | --- |
| **en** | no signal |
| **ko** | 신호 없음 |
| **ja** | 信号なし |
| **zh-Hans** | 无信号 |
| **zh-Hant** | 無訊號 |
| **es** | sin señal |

### `tuner.meter.reading`

Placeholders: `{cents}`, `{verdict}`

| | Text |
| --- | --- |
| **en** | {cents} cents {verdict} |
| **ko** | {cents}센트 {verdict} |
| **ja** | {cents}セント {verdict} |
| **zh-Hans** | {cents} 音分 {verdict} |
| **zh-Hant** | {cents} 音分 {verdict} |
| **es** | {cents} centésimas {verdict} |

### `tuner.waiting.title`

| | Text |
| --- | --- |
| **en** | Waiting for microphone permission |
| **ko** | 마이크 권한을 기다리는 중 |
| **ja** | マイクの許可を待っています |
| **zh-Hans** | 正在等待麦克风权限 |
| **zh-Hant** | 正在等待麥克風權限 |
| **es** | Esperando permiso del micrófono |

### `tuner.waiting.body`

| | Text |
| --- | --- |
| **en** | Your browser is asking whether FretLab may use the microphone. Choose Allow to start tuning. Nothing is recorded, uploaded or stored: the audio is analysed in the page and discarded. |
| **ko** | FretLab이 마이크를 사용해도 되는지 브라우저가 묻고 있습니다. 허용을 선택하면 조율을 시작합니다. 아무것도 녹음하거나 전송하거나 저장하지 않으며, 소리는 페이지 안에서 분석한 뒤 버려집니다. |
| **ja** | FretLab がマイクを使ってよいかブラウザが尋ねています。「許可」を選ぶとチューニングを始めます。録音・送信・保存は一切せず、音はページ内で解析してすぐ破棄します。 |
| **zh-Hans** | 浏览器正在询问 FretLab 是否可以使用麦克风。选择“允许”即可开始调音。不会录音、上传或保存任何内容：声音在页面内分析后随即丢弃。 |
| **zh-Hant** | 瀏覽器正在詢問 FretLab 是否可以使用麥克風。選擇「允許」即可開始調音。不會錄音、上傳或儲存任何內容：聲音在頁面內分析後隨即丟棄。 |
| **es** | Tu navegador está preguntando si FretLab puede usar el micrófono. Elige Permitir para empezar a afinar. No se graba, sube ni guarda nada: el audio se analiza en la página y se descarta. |

### `tuner.ready.title`

| | Text |
| --- | --- |
| **en** | Tuner ready |
| **ko** | 튜너 준비됨 |
| **ja** | チューナーの準備ができました |
| **zh-Hans** | 调音器已就绪 |
| **zh-Hant** | 調音器已就緒 |
| **es** | Afinador listo |

### `tuner.ready.body`

| | Text |
| --- | --- |
| **en** | The tuner listens through your microphone. Permission is requested only now, when you actually open the tuner. |
| **ko** | 튜너는 마이크로 듣습니다. 권한은 튜너를 실제로 열었을 때에만 요청합니다. |
| **ja** | チューナーはマイクで聞き取ります。許可を求めるのは、実際にチューナーを開いたこのときだけです。 |
| **zh-Hans** | 调音器通过麦克风聆听。只有在你真正打开调音器时才会请求权限。 |
| **zh-Hant** | 調音器透過麥克風聆聽。只有在你真正開啟調音器時才會請求權限。 |
| **es** | El afinador escucha por el micrófono. El permiso se pide solo ahora, cuando abres el afinador de verdad. |

### `tuner.start`

| | Text |
| --- | --- |
| **en** | Start listening |
| **ko** | 듣기 시작 |
| **ja** | 聞き取りを開始 |
| **zh-Hans** | 开始聆听 |
| **zh-Hant** | 開始聆聽 |
| **es** | Empezar a escuchar |

### `tuner.retry`

| | Text |
| --- | --- |
| **en** | Try again |
| **ko** | 다시 시도 |
| **ja** | もう一度試す |
| **zh-Hans** | 重试 |
| **zh-Hant** | 再試一次 |
| **es** | Reintentar |

### `tuner.error.denied`

| | Text |
| --- | --- |
| **en** | Microphone permission denied |
| **ko** | 마이크 권한이 거부되었습니다 |
| **ja** | マイクの使用が拒否されました |
| **zh-Hans** | 麦克风权限被拒绝 |
| **zh-Hant** | 麥克風權限遭拒 |
| **es** | Permiso de micrófono denegado |

### `tuner.error.noDevice`

| | Text |
| --- | --- |
| **en** | No microphone found |
| **ko** | 마이크를 찾을 수 없습니다 |
| **ja** | マイクが見つかりません |
| **zh-Hans** | 找不到麦克风 |
| **zh-Hant** | 找不到麥克風 |
| **es** | No se ha encontrado ningún micrófono |

### `tuner.error.insecure`

| | Text |
| --- | --- |
| **en** | A secure connection is required |
| **ko** | 보안 연결이 필요합니다 |
| **ja** | 安全な接続が必要です |
| **zh-Hans** | 需要安全连接 |
| **zh-Hant** | 需要安全連線 |
| **es** | Hace falta una conexión segura |

### `tuner.error.unsupported`

| | Text |
| --- | --- |
| **en** | This browser cannot capture audio |
| **ko** | 이 브라우저는 소리를 입력받을 수 없습니다 |
| **ja** | このブラウザは音声を取り込めません |
| **zh-Hans** | 此浏览器无法采集音频 |
| **zh-Hant** | 這個瀏覽器無法擷取音訊 |
| **es** | Este navegador no puede capturar audio |

### `tuner.error.other`

| | Text |
| --- | --- |
| **en** | The tuner could not start |
| **ko** | 튜너를 시작할 수 없습니다 |
| **ja** | チューナーを開始できませんでした |
| **zh-Hans** | 调音器无法启动 |
| **zh-Hant** | 調音器無法啟動 |
| **es** | El afinador no ha podido arrancar |

### `tuner.error.unknown`

| | Text |
| --- | --- |
| **en** | An unknown problem stopped the tuner. |
| **ko** | 알 수 없는 문제로 튜너가 멈췄습니다. |
| **ja** | 原因不明の問題でチューナーが停止しました。 |
| **zh-Hans** | 调音器因未知问题停止。 |
| **zh-Hant** | 調音器因不明問題停止。 |
| **es** | Un problema desconocido ha detenido el afinador. |

### `tuner.msg.denied`

| | Text |
| --- | --- |
| **en** | Microphone permission was denied. Allow microphone access for this site in your browser settings, then start the tuner again. |
| **ko** | 마이크 권한이 거부되었습니다. 브라우저 설정에서 이 사이트의 마이크 사용을 허용한 뒤 튜너를 다시 시작하세요. |
| **ja** | マイクの使用が拒否されました。ブラウザの設定でこのサイトのマイク使用を許可してから、チューナーをもう一度開始してください。 |
| **zh-Hans** | 麦克风权限被拒绝。请在浏览器设置中允许本站使用麦克风，然后重新启动调音器。 |
| **zh-Hant** | 麥克風權限遭拒。請在瀏覽器設定中允許本站使用麥克風，然後重新啟動調音器。 |
| **es** | Se denegó el permiso del micrófono. Permite el acceso al micrófono para este sitio en los ajustes de tu navegador y vuelve a iniciar el afinador. |

### `tuner.msg.noDevice`

| | Text |
| --- | --- |
| **en** | No microphone was found. Connect an input device and try again. |
| **ko** | 마이크를 찾지 못했습니다. 입력 장치를 연결하고 다시 시도하세요. |
| **ja** | マイクが見つかりませんでした。入力機器を接続して、もう一度お試しください。 |
| **zh-Hans** | 没有找到麦克风。请接上输入设备后重试。 |
| **zh-Hant** | 找不到麥克風。請接上輸入裝置後再試一次。 |
| **es** | No se encontró ningún micrófono. Conecta un dispositivo de entrada e inténtalo de nuevo. |

### `tuner.msg.insecure`

| | Text |
| --- | --- |
| **en** | Microphone access needs a secure context. Open the site over HTTPS, or on http://localhost during development. |
| **ko** | 마이크 사용에는 보안 연결이 필요합니다. HTTPS로 접속하거나 개발 중에는 http://localhost를 사용하세요. |
| **ja** | マイクの使用には安全な接続が必要です。HTTPS で開くか、開発中は http://localhost をお使いください。 |
| **zh-Hans** | 使用麦克风需要安全环境。请通过 HTTPS 打开本站，开发时可用 http://localhost。 |
| **zh-Hant** | 使用麥克風需要安全環境。請以 HTTPS 開啟本站，開發時可用 http://localhost。 |
| **es** | El acceso al micrófono necesita un contexto seguro. Abre el sitio por HTTPS, o en http://localhost durante el desarrollo. |

### `tuner.msg.unsupported`

| | Text |
| --- | --- |
| **en** | This browser does not expose microphone input, so the tuner cannot listen. Note playback still works. |
| **ko** | 이 브라우저는 마이크 입력을 제공하지 않아 튜너가 들을 수 없습니다. 음 재생은 그대로 됩니다. |
| **ja** | このブラウザはマイク入力に対応していないため、チューナーは聞き取れません。音の再生はそのまま使えます。 |
| **zh-Hans** | 此浏览器不提供麦克风输入，调音器无法聆听。音符播放仍可正常使用。 |
| **zh-Hant** | 這個瀏覽器不提供麥克風輸入，調音器無法聆聽。音符播放仍可正常使用。 |
| **es** | Este navegador no expone la entrada de micrófono, así que el afinador no puede escuchar. La reproducción de notas sigue funcionando. |

### `tuner.msg.failed`

Placeholders: `{reason}`

| | Text |
| --- | --- |
| **en** | The microphone could not be opened: {reason} |
| **ko** | 마이크를 열 수 없습니다: {reason} |
| **ja** | マイクを開けませんでした: {reason} |
| **zh-Hans** | 无法打开麦克风：{reason} |
| **zh-Hant** | 無法開啟麥克風：{reason} |
| **es** | No se pudo abrir el micrófono: {reason} |

### `tuner.msg.audioInit`

Placeholders: `{reason}`

| | Text |
| --- | --- |
| **en** | Audio input could not be initialised: {reason} |
| **ko** | 오디오 입력을 초기화할 수 없습니다: {reason} |
| **ja** | 音声入力を初期化できませんでした: {reason} |
| **zh-Hans** | 音频输入初始化失败：{reason} |
| **zh-Hant** | 音訊輸入初始化失敗：{reason} |
| **es** | No se pudo inicializar la entrada de audio: {reason} |

## Instrument view

*The toolbar, the small map and the hints around the instrument.*

### `stage.label`

| | Text |
| --- | --- |
| **en** | Instrument view |
| **ko** | 악기 화면 |
| **ja** | 楽器の表示 |
| **zh-Hans** | 乐器视图 |
| **zh-Hant** | 樂器檢視 |
| **es** | Vista del instrumento |

### `stage.controls`

| | Text |
| --- | --- |
| **en** | Controls |
| **ko** | 설정 |
| **ja** | 設定 |
| **zh-Hans** | 设置 |
| **zh-Hant** | 設定 |
| **es** | Controles |

### `stage.zoomOut`

| | Text |
| --- | --- |
| **en** | Zoom out |
| **ko** | 축소 |
| **ja** | 縮小 |
| **zh-Hans** | 缩小 |
| **zh-Hant** | 縮小 |
| **es** | Alejar |

### `stage.zoomIn`

| | Text |
| --- | --- |
| **en** | Zoom in |
| **ko** | 확대 |
| **ja** | 拡大 |
| **zh-Hans** | 放大 |
| **zh-Hant** | 放大 |
| **es** | Acercar |

### `stage.zoom`

| | Text |
| --- | --- |
| **en** | Zoom |
| **ko** | 확대 |
| **ja** | 拡大 |
| **zh-Hans** | 缩放 |
| **zh-Hant** | 縮放 |
| **es** | Zoom |

### `stage.map`

| | Text |
| --- | --- |
| **en** | Where you are on the instrument |
| **ko** | 악기에서 보고 있는 위치 |
| **ja** | 楽器のどこを表示しているか |
| **zh-Hans** | 当前显示的乐器位置 |
| **zh-Hant** | 目前顯示的樂器位置 |
| **es** | Qué parte del instrumento se ve |

### `stage.map.help`

| | Text |
| --- | --- |
| **en** | Drag the box, or use the arrow keys, to move along the instrument |
| **ko** | 상자를 끌거나 방향키를 눌러 악기를 따라 이동합니다 |
| **ja** | 枠をドラッグするか矢印キーで、楽器に沿って移動します |
| **zh-Hans** | 拖动方框或按方向键，沿乐器移动 |
| **zh-Hant** | 拖曳方框或按方向鍵，沿樂器移動 |
| **es** | Arrastra el recuadro, o usa las flechas, para recorrer el instrumento |

### `stage.reset`

| | Text |
| --- | --- |
| **en** | Reset |
| **ko** | 기본 크기 |
| **ja** | 等倍 |
| **zh-Hans** | 原始大小 |
| **zh-Hant** | 原始大小 |
| **es** | Restablecer |

### `stage.reset.help`

| | Text |
| --- | --- |
| **en** | Back to 100% |
| **ko** | 100%로 되돌리기 |
| **ja** | 100% に戻す |
| **zh-Hans** | 回到 100% |
| **zh-Hant** | 回到 100% |
| **es** | Volver al 100% |

### `stage.whole`

| | Text |
| --- | --- |
| **en** | Whole instrument |
| **ko** | 악기 전체 |
| **ja** | 楽器全体 |
| **zh-Hans** | 整把乐器 |
| **zh-Hant** | 整把樂器 |
| **es** | Instrumento completo |

### `stage.whole.help`

| | Text |
| --- | --- |
| **en** | Zoom out to show the whole instrument |
| **ko** | 악기 전체가 보이도록 축소합니다 |
| **ja** | 楽器全体が見えるように縮小します |
| **zh-Hans** | 缩小到能看见整把乐器 |
| **zh-Hant** | 縮小到能看見整把樂器 |
| **es** | Alejar hasta ver el instrumento entero |

### `stage.hint`

| | Text |
| --- | --- |
| **en** | Drag the box on the small neck to move along the instrument · use the slider to zoom · click a position to hear it |
| **ko** | 작은 넥 위의 상자를 끌어 악기를 따라 이동 · 슬라이더로 확대 · 위치를 누르면 소리가 납니다 |
| **ja** | 小さなネックの枠をドラッグして移動 · スライダーで拡大 · 位置を押すと音が鳴ります |
| **zh-Hans** | 拖动小琴颈上的方框沿乐器移动 · 用滑块缩放 · 点按位置即可听音 |
| **zh-Hant** | 拖曳小琴頸上的方框沿樂器移動 · 用滑桿縮放 · 點按位置即可聽音 |
| **es** | Arrastra el recuadro del mástil pequeño para recorrer el instrumento · usa el control deslizante para el zoom · pulsa una posición para oírla |

### `stage.hint.tuner`

| | Text |
| --- | --- |
| **en** | Tuner mode: the view is parked on the headstock. Closing it restores your previous position and zoom. |
| **ko** | 튜너 모드: 화면이 헤드에 머뭅니다. 닫으면 이전 위치와 배율로 돌아갑니다. |
| **ja** | チューナーモード: 表示がヘッドに固定されます。閉じると元の位置と倍率に戻ります。 |
| **zh-Hans** | 调音器模式：视角停在琴头。关闭后会回到原先的位置与缩放。 |
| **zh-Hant** | 調音器模式：視角停在琴頭。關閉後會回到原先的位置與縮放。 |
| **es** | Modo afinador: la vista queda fijada en la pala. Al cerrarlo se restauran tu posición y zoom anteriores. |

## Fretboard (screen readers)

*Spoken names of the fretboard and of each position on it.*

### `fretboard.label`

Placeholders: `{instrument}`

| | Text |
| --- | --- |
| **en** | {instrument} fretboard |
| **ko** | {instrument} 지판 |
| **ja** | {instrument}の指板 |
| **zh-Hans** | {instrument}指板 |
| **zh-Hant** | {instrument}指板 |
| **es** | Diapasón de {instrument} |

### `fretboard.grid`

Placeholders: `{note}`

| | Text |
| --- | --- |
| **en** | Fretboard. Arrow keys move between positions, Enter plays. Current position: {note}. |
| **ko** | 지판입니다. 화살표 키로 이동하고 Enter로 소리를 냅니다. 현재 위치: {note}. |
| **ja** | 指板です。矢印キーで移動し、Enter で音を鳴らします。現在の位置: {note}。 |
| **zh-Hans** | 指板。方向键移动，回车发声。当前位置：{note}。 |
| **zh-Hant** | 指板。方向鍵移動，Enter 發聲。目前位置：{note}。 |
| **es** | Diapasón. Las flechas mueven entre posiciones, Enter toca. Posición actual: {note}. |

### `fretboard.current`

Placeholders: `{note}`

| | Text |
| --- | --- |
| **en** | Fretboard, currently on {note} |
| **ko** | 지판, 현재 위치 {note} |
| **ja** | 指板、現在の位置は {note} |
| **zh-Hans** | 指板，当前位于 {note} |
| **zh-Hant** | 指板，目前位於 {note} |
| **es** | Diapasón, actualmente en {note} |

### `fretboard.cell`

Placeholders: `{note}`, `{string}`, `{where}`

| | Text |
| --- | --- |
| **en** | {note}, string {string}, {where} |
| **ko** | {note}, {string}번 현, {where} |
| **ja** | {note}、{string}弦、{where} |
| **zh-Hans** | {note}，第{string}弦，{where} |
| **zh-Hant** | {note}，第{string}弦，{where} |
| **es** | {note}, cuerda {string}, {where} |

## Footer

*The line at the bottom of the page.*

### `footer.note`

| | Text |
| --- | --- |
| **en** | FretLab — all note names, scales, chord shapes and tuner targets are calculated from the selected tuning. |
| **ko** | FretLab — 모든 음 이름, 스케일, 코드 폼, 튜너 목표음은 선택한 튜닝에서 계산됩니다. |
| **ja** | FretLab — 音名・スケール・コードフォーム・チューナーの目標音は、すべて選んだチューニングから計算されます。 |
| **zh-Hans** | FretLab — 所有音名、音阶、和弦指型与调音目标音，都由选定的调弦算出。 |
| **zh-Hant** | FretLab — 所有音名、音階、和弦指型與調音目標音，都由選定的調弦算出。 |
| **es** | FretLab — todos los nombres de nota, escalas, posiciones de acorde y objetivos del afinador se calculan a partir de la afinación elegida. |

## Error screen

*Shown only if the page fails to render.*

### `crash.title`

| | Text |
| --- | --- |
| **en** | FretLab ran into a problem |
| **ko** | FretLab에 문제가 생겼습니다 |
| **ja** | FretLab で問題が起きました |
| **zh-Hans** | FretLab 出现了问题 |
| **zh-Hant** | FretLab 發生了問題 |
| **es** | FretLab ha tenido un problema |

### `crash.body`

| | Text |
| --- | --- |
| **en** | Something in the interface failed to render. The details are in your browser console. |
| **ko** | 화면을 그리는 중 오류가 났습니다. 자세한 내용은 브라우저 콘솔에 있습니다. |
| **ja** | 画面の描画に失敗しました。詳細はブラウザのコンソールにあります。 |
| **zh-Hans** | 界面渲染失败。详细信息在浏览器控制台中。 |
| **zh-Hant** | 介面繪製失敗。詳細資訊在瀏覽器主控台中。 |
| **es** | Algo de la interfaz no se ha podido dibujar. Los detalles están en la consola del navegador. |

### `crash.reload`

| | Text |
| --- | --- |
| **en** | Reload the page |
| **ko** | 페이지 새로 고치기 |
| **ja** | ページを再読み込み |
| **zh-Hans** | 重新加载页面 |
| **zh-Hant** | 重新載入頁面 |
| **es** | Recargar la página |

### `crash.clear`

| | Text |
| --- | --- |
| **en** | Clear saved settings and reload |
| **ko** | 저장된 설정을 지우고 새로 고치기 |
| **ja** | 保存した設定を消して再読み込み |
| **zh-Hans** | 清除已保存的设置并重新加载 |
| **zh-Hant** | 清除已儲存的設定並重新載入 |
| **es** | Borrar los ajustes guardados y recargar |

## Help bubbles

*The prefix a screen reader speaks before a help text.*

### `help.prefix`

Placeholders: `{text}`

| | Text |
| --- | --- |
| **en** | Help: {text} |
| **ko** | 도움말: {text} |
| **ja** | ヘルプ: {text} |
| **zh-Hans** | 帮助：{text} |
| **zh-Hant** | 說明：{text} |
| **es** | Ayuda: {text} |

---

# Part 2 — Music catalogues

## Scales and modes

*The scale chooser: the name in the menu and the one-line description under it.*

### `major`

| | Name | Description |
| --- | --- | --- |
| **en** | Major (Ionian) | The reference major scale. Bright and resolved. |
| **ko** | 장음계 (아이오니안) | 기준이 되는 장음계. 밝고 안정적입니다. |
| **ja** | メジャー（アイオニアン） | 基準となる長音階。明るく安定した響きです。 |
| **zh-Hans** | 大调（伊奥尼亚） | 基准的大音阶，明亮而稳定。 |
| **zh-Hant** | 大調（伊奧尼亞） | 基準的大音階，明亮而穩定。 |
| **es** | Mayor (jónica) | La escala mayor de referencia. Brillante y resuelta. |

### `natural-minor`

| | Name | Description |
| --- | --- | --- |
| **en** | Natural minor (Aeolian) | The standard minor scale: the same notes as the major a minor 3rd above. |
| **ko** | 자연 단음계 (에올리안) | 기본 단음계. 단3도 위 장음계와 구성음이 같습니다. |
| **ja** | ナチュラルマイナー（エオリアン） | 標準的な短音階。短3度上のメジャーと同じ音で構成されます。 |
| **zh-Hans** | 自然小调（爱奥利亚） | 标准小音阶，与上方小三度的大调用音相同。 |
| **zh-Hant** | 自然小調（愛奧利亞） | 標準小音階，與上方小三度的大調用音相同。 |
| **es** | Menor natural (eólica) | La escala menor estándar: las mismas notas que la mayor una tercera menor por encima. |

### `harmonic-minor`

| | Name | Description |
| --- | --- | --- |
| **en** | Harmonic minor | Natural minor with a raised 7th, which yields a dominant V chord in minor. |
| **ko** | 화성 단음계 | 자연 단음계의 7음을 올린 음계로, 단조에 딸림화음을 만들어 줍니다. |
| **ja** | ハーモニックマイナー | ナチュラルマイナーの7音を上げた音階。短調にドミナントの V が生まれます。 |
| **zh-Hans** | 和声小调 | 自然小调升高第七音，使小调获得属和弦 V。 |
| **zh-Hant** | 和聲小調 | 自然小調升高第七音，使小調得到屬和弦 V。 |
| **es** | Menor armónica | Menor natural con la 7ª elevada, lo que da un acorde V dominante en modo menor. |

### `melodic-minor`

| | Name | Description |
| --- | --- | --- |
| **en** | Melodic minor (ascending) | Minor 3rd with major 6th and 7th. The jazz minor scale. |
| **ko** | 가락 단음계 (상행) | 단3도에 장6도와 장7도. 재즈 마이너 음계입니다. |
| **ja** | メロディックマイナー（上行） | 短3度に長6度と長7度。ジャズマイナーの音階です。 |
| **zh-Hans** | 旋律小调（上行） | 小三度配大六度与大七度，即爵士小调。 |
| **zh-Hant** | 旋律小調（上行） | 小三度配大六度與大七度，即爵士小調。 |
| **es** | Menor melódica (ascendente) | Tercera menor con 6ª y 7ª mayores. La menor del jazz. |

### `harmonic-major`

| | Name | Description |
| --- | --- | --- |
| **en** | Harmonic major | Major scale with a flattened 6th. |
| **ko** | 화성 장음계 | 장음계의 6음을 내린 음계. |
| **ja** | ハーモニックメジャー | 長音階の6音を下げた音階。 |
| **zh-Hans** | 和声大调 | 大调降低第六音。 |
| **zh-Hant** | 和聲大調 | 大調降低第六音。 |
| **es** | Mayor armónica | Escala mayor con la 6ª rebajada. |

### `ionian`

| | Name | Description |
| --- | --- | --- |
| **en** | Ionian | 1st mode of the major scale, identical to the major scale. |
| **ko** | 아이오니안 | 장음계의 1번째 모드로, 장음계와 같습니다. |
| **ja** | アイオニアン | 長音階の第1モードで、長音階と同じです。 |
| **zh-Hans** | 伊奥尼亚 | 大调的第一调式，与大音阶相同。 |
| **zh-Hant** | 伊奧尼亞 | 大調的第一調式，與大音階相同。 |
| **es** | Jónica | 1er modo de la escala mayor, idéntico a la escala mayor. |

### `dorian`

| | Name | Description |
| --- | --- | --- |
| **en** | Dorian | 2nd mode: minor with a natural 6th. Very common over m7 chords. |
| **ko** | 도리안 | 2번째 모드. 단조에 장6도가 들어갑니다. m7 코드에서 매우 흔합니다. |
| **ja** | ドリアン | 第2モード。短調に長6度。m7 コードで非常によく使われます。 |
| **zh-Hans** | 多利亚 | 第二调式：小调配大六度，在 m7 和弦上极为常用。 |
| **zh-Hant** | 多利安 | 第二調式：小調配大六度，在 m7 和弦上極為常用。 |
| **es** | Dórica | 2º modo: menor con 6ª natural. Muy común sobre acordes m7. |

### `phrygian`

| | Name | Description |
| --- | --- | --- |
| **en** | Phrygian | 3rd mode: minor with a flat 2nd. Spanish and metal flavour. |
| **ko** | 프리지안 | 3번째 모드. 단조에 단2도. 스페인풍과 메탈의 색채입니다. |
| **ja** | フリジアン | 第3モード。短調に短2度。スパニッシュやメタルの響きです。 |
| **zh-Hans** | 弗里几亚 | 第三调式：小调配小二度，西班牙与金属色彩。 |
| **zh-Hant** | 弗里吉安 | 第三調式：小調配小二度，西班牙與金屬色彩。 |
| **es** | Frigia | 3er modo: menor con 2ª menor. Sabor español y metalero. |

### `lydian`

| | Name | Description |
| --- | --- | --- |
| **en** | Lydian | 4th mode: major with a sharp 4th. Floating and filmic. |
| **ko** | 리디안 | 4번째 모드. 장조에 증4도. 떠 있는 듯한 영화적 음색입니다. |
| **ja** | リディアン | 第4モード。長調に増4度。浮遊感のある映画的な響きです。 |
| **zh-Hans** | 利底亚 | 第四调式：大调配增四度，飘浮而富电影感。 |
| **zh-Hant** | 利地安 | 第四調式：大調配增四度，飄浮而富電影感。 |
| **es** | Lidia | 4º modo: mayor con 4ª aumentada. Flotante y cinematográfica. |

### `mixolydian`

| | Name | Description |
| --- | --- | --- |
| **en** | Mixolydian | 5th mode: major with a flat 7th. The dominant-7th sound. |
| **ko** | 믹솔리디안 | 5번째 모드. 장조에 단7도. 딸림7 화음의 소리입니다. |
| **ja** | ミクソリディアン | 第5モード。長調に短7度。ドミナント7thの響きです。 |
| **zh-Hans** | 混合利底亚 | 第五调式：大调配小七度，属七和弦的声响。 |
| **zh-Hant** | 米索利地安 | 第五調式：大調配小七度，屬七和弦的聲響。 |
| **es** | Mixolidia | 5º modo: mayor con 7ª menor. El sonido del acorde de séptima. |

### `aeolian`

| | Name | Description |
| --- | --- | --- |
| **en** | Aeolian | 6th mode, identical to the natural minor scale. |
| **ko** | 에올리안 | 6번째 모드로, 자연 단음계와 같습니다. |
| **ja** | エオリアン | 第6モードで、ナチュラルマイナーと同じです。 |
| **zh-Hans** | 爱奥利亚 | 第六调式，与自然小调相同。 |
| **zh-Hant** | 愛奧利亞 | 第六調式，與自然小調相同。 |
| **es** | Eólica | 6º modo, idéntico a la escala menor natural. |

### `locrian`

| | Name | Description |
| --- | --- | --- |
| **en** | Locrian | 7th mode: flat 2nd and flat 5th. Fits m7b5 chords. |
| **ko** | 로크리안 | 7번째 모드. 단2도와 감5도. m7b5 코드에 맞습니다. |
| **ja** | ロクリアン | 第7モード。短2度と減5度。m7b5 コードに合います。 |
| **zh-Hans** | 洛克里亚 | 第七调式：小二度与减五度，适合 m7b5 和弦。 |
| **zh-Hant** | 洛克里安 | 第七調式：小二度與減五度，適合 m7b5 和弦。 |
| **es** | Locria | 7º modo: 2ª y 5ª rebajadas. Encaja con acordes m7b5. |

### `lydian-dominant`

| | Name | Description |
| --- | --- | --- |
| **en** | Lydian dominant | 4th mode of melodic minor: sharp 4th and flat 7th together. |
| **ko** | 리디안 도미넌트 | 가락 단음계의 4번째 모드. 증4도와 단7도가 함께 있습니다. |
| **ja** | リディアン・ドミナント | メロディックマイナーの第4モード。増4度と短7度が同居します。 |
| **zh-Hans** | 利底亚属 | 旋律小调的第四调式：增四度与小七度并存。 |
| **zh-Hant** | 利地安屬 | 旋律小調的第四調式：增四度與小七度並存。 |
| **es** | Lidia dominante | 4º modo de la menor melódica: 4ª aumentada y 7ª menor a la vez. |

### `phrygian-dominant`

| | Name | Description |
| --- | --- | --- |
| **en** | Phrygian dominant | 5th mode of harmonic minor. The flamenco / Phrygian-major sound. |
| **ko** | 프리지안 도미넌트 | 화성 단음계의 5번째 모드. 플라멩코풍 소리입니다. |
| **ja** | フリジアン・ドミナント | ハーモニックマイナーの第5モード。フラメンコ風の響きです。 |
| **zh-Hans** | 弗里几亚属 | 和声小调的第五调式，弗拉门戈的声响。 |
| **zh-Hant** | 弗里吉安屬 | 和聲小調的第五調式，佛朗明哥的聲響。 |
| **es** | Frigia dominante | 5º modo de la menor armónica. El sonido flamenco. |

### `altered`

| | Name | Description |
| --- | --- | --- |
| **en** | Altered (super-Locrian) | 7th mode of melodic minor, the altered-dominant scale. |
| **ko** | 얼터드 (슈퍼 로크리안) | 가락 단음계의 7번째 모드. 얼터드 도미넌트 음계입니다. |
| **ja** | オルタード（スーパーロクリアン） | メロディックマイナーの第7モード。オルタード・ドミナントの音階です。 |
| **zh-Hans** | 变化音阶（超洛克里亚） | 旋律小调的第七调式，即变化属音阶。 |
| **zh-Hant** | 變化音階（超洛克里安） | 旋律小調的第七調式，即變化屬音階。 |
| **es** | Alterada (superlocria) | 7º modo de la menor melódica, la escala del dominante alterado. |

### `major-pentatonic`

| | Name | Description |
| --- | --- | --- |
| **en** | Major pentatonic | Major scale without the 4th and 7th, so it contains no half steps. |
| **ko** | 장5음 음계 | 장음계에서 4음과 7음을 뺀 음계로, 반음이 없습니다. |
| **ja** | メジャーペンタトニック | 長音階から4音と7音を除いた音階で、半音を含みません。 |
| **zh-Hans** | 大调五声 | 大音阶去掉第四与第七音，不含半音。 |
| **zh-Hant** | 大調五聲 | 大音階去掉第四與第七音，不含半音。 |
| **es** | Pentatónica mayor | La escala mayor sin la 4ª ni la 7ª, de modo que no tiene semitonos. |

### `minor-pentatonic`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor pentatonic | The core rock and blues lead scale. |
| **ko** | 단5음 음계 | 록과 블루스 솔로의 기본 음계. |
| **ja** | マイナーペンタトニック | ロックとブルースのリードの基本となる音階。 |
| **zh-Hans** | 小调五声 | 摇滚与布鲁斯主奏的核心音阶。 |
| **zh-Hant** | 小調五聲 | 搖滾與藍調主奏的核心音階。 |
| **es** | Pentatónica menor | La escala básica del solo en rock y blues. |

### `hirajoshi`

| | Name | Description |
| --- | --- | --- |
| **en** | Hirajoshi | Japanese pentatonic containing two half steps. |
| **ko** | 히라조시 | 반음이 두 번 들어가는 일본식 5음 음계. |
| **ja** | 平調子 | 半音を2つ含む日本の5音音階。 |
| **zh-Hans** | 平调子 | 含两个半音的日本五声音阶。 |
| **zh-Hant** | 平調子 | 含兩個半音的日本五聲音階。 |
| **es** | Hirajoshi | Pentatónica japonesa con dos semitonos. |

### `blues`

| | Name | Description |
| --- | --- | --- |
| **en** | Blues (minor) | Minor pentatonic plus the flat-5th blue note. |
| **ko** | 블루스 (단조) | 단5음 음계에 감5도 블루 노트를 더한 음계. |
| **ja** | ブルース（マイナー） | マイナーペンタトニックに減5度のブルーノートを加えた音階。 |
| **zh-Hans** | 布鲁斯（小调） | 小调五声加上降五度的蓝调音。 |
| **zh-Hant** | 藍調（小調） | 小調五聲加上降五度的藍調音。 |
| **es** | Blues (menor) | Pentatónica menor más la blue note de 5ª rebajada. |

### `major-blues`

| | Name | Description |
| --- | --- | --- |
| **en** | Blues (major) | Major pentatonic plus the flat-3rd passing tone. |
| **ko** | 블루스 (장조) | 장5음 음계에 단3도 경과음을 더한 음계. |
| **ja** | ブルース（メジャー） | メジャーペンタトニックに短3度の経過音を加えた音階。 |
| **zh-Hans** | 布鲁斯（大调） | 大调五声加上降三度的经过音。 |
| **zh-Hant** | 藍調（大調） | 大調五聲加上降三度的經過音。 |
| **es** | Blues (mayor) | Pentatónica mayor más la nota de paso de 3ª menor. |

### `whole-tone`

| | Name | Description |
| --- | --- | --- |
| **en** | Whole tone | All whole steps. Pairs with augmented chords. |
| **ko** | 온음 음계 | 모두 온음 간격. 증화음과 잘 어울립니다. |
| **ja** | ホールトーン | すべて全音。オーギュメントのコードと相性がよい音階です。 |
| **zh-Hans** | 全音阶 | 全为全音，与增和弦相配。 |
| **zh-Hant** | 全音階 | 全為全音，與增和弦相配。 |
| **es** | Tonos enteros | Todo tonos. Casa con los acordes aumentados. |

### `dim-half-whole`

| | Name | Description |
| --- | --- | --- |
| **en** | Diminished (half-whole) | Octatonic scale used over altered dominant chords. |
| **ko** | 디미니시드 (반–온) | 얼터드 도미넌트 코드에 쓰는 8음 음계. |
| **ja** | ディミニッシュト（半–全） | オルタード・ドミナントに使う8音音階。 |
| **zh-Hans** | 减音阶（半–全） | 用于变化属和弦的八音音阶。 |
| **zh-Hant** | 減音階（半–全） | 用於變化屬和弦的八音音階。 |
| **es** | Disminuida (semitono–tono) | Escala octatónica usada sobre dominantes alterados. |

### `dim-whole-half`

| | Name | Description |
| --- | --- | --- |
| **en** | Diminished (whole-half) | Octatonic scale used over diminished-7th chords. |
| **ko** | 디미니시드 (온–반) | 감7 화음에 쓰는 8음 음계. |
| **ja** | ディミニッシュト（全–半） | ディミニッシュ7thコードに使う8音音階。 |
| **zh-Hans** | 减音阶（全–半） | 用于减七和弦的八音音阶。 |
| **zh-Hant** | 減音階（全–半） | 用於減七和弦的八音音階。 |
| **es** | Disminuida (tono–semitono) | Escala octatónica usada sobre acordes de séptima disminuida. |

### `chromatic`

| | Name | Description |
| --- | --- | --- |
| **en** | Chromatic | Every semitone. Useful as a plain fretboard reference. |
| **ko** | 반음계 | 모든 반음. 지판을 훑어보는 기준으로 쓸 만합니다. |
| **ja** | クロマチック | すべての半音。指板を見渡す基準として使えます。 |
| **zh-Hans** | 半音阶 | 全部十二个半音，可作为通览指板的参考。 |
| **zh-Hant** | 半音階 | 全部十二個半音，可作為通覽指板的參考。 |
| **es** | Cromática | Todos los semitonos. Útil como referencia del diapasón. |

### `hungarian-minor`

| | Name | Description |
| --- | --- | --- |
| **en** | Hungarian minor | Harmonic minor with a raised 4th. |
| **ko** | 헝가리안 마이너 | 화성 단음계의 4음을 올린 음계. |
| **ja** | ハンガリアンマイナー | ハーモニックマイナーの4音を上げた音階。 |
| **zh-Hans** | 匈牙利小调 | 和声小调升高第四音。 |
| **zh-Hant** | 匈牙利小調 | 和聲小調升高第四音。 |
| **es** | Menor húngara | Menor armónica con la 4ª elevada. |

### `double-harmonic`

| | Name | Description |
| --- | --- | --- |
| **en** | Double harmonic (Byzantine) | Flat 2nd and flat 6th against a major 3rd and 7th. |
| **ko** | 더블 하모닉 (비잔틴) | 장3도·장7도에 단2도와 단6도가 더해진 음계. |
| **ja** | ダブルハーモニック（ビザンチン） | 長3度・長7度に短2度と短6度が加わった音階。 |
| **zh-Hans** | 双和声（拜占庭） | 大三度与大七度之上配小二度和小六度。 |
| **zh-Hant** | 雙和聲（拜占庭） | 大三度與大七度之上配小二度和小六度。 |
| **es** | Doble armónica (bizantina) | 2ª y 6ª rebajadas frente a 3ª y 7ª mayores. |

### `bebop-dominant`

| | Name | Description |
| --- | --- | --- |
| **en** | Bebop dominant | Mixolydian with the natural 7th added as a passing tone. |
| **ko** | 비밥 도미넌트 | 믹솔리디안에 장7도를 경과음으로 더한 음계. |
| **ja** | ビバップ・ドミナント | ミクソリディアンに長7度を経過音として加えた音階。 |
| **zh-Hans** | 比博普属 | 混合利底亚再加大七度作经过音。 |
| **zh-Hant** | 咆勃屬 | 米索利地安再加大七度作經過音。 |
| **es** | Bebop dominante | Mixolidia con la 7ª mayor añadida como nota de paso. |

## Chord types

*The chord chooser: the name in the menu and the one-line description under it.*

### `5`

| | Name | Description |
| --- | --- | --- |
| **en** | Power chord (root + 5th) | No 3rd, so it works over both major and minor riffs. |
| **ko** | 파워 코드 (근음 + 5도) | 3음이 없어 장조와 단조 리프 모두에 쓸 수 있습니다. |
| **ja** | パワーコード（ルート＋5度） | 3度がないので、長調と短調どちらのリフにも使えます。 |
| **zh-Hans** | 强力和弦（根音＋五度） | 没有三度，大调小调的riff都能用。 |
| **zh-Hant** | 強力和弦（根音＋五度） | 沒有三度，大調小調的 riff 都能用。 |
| **es** | Acorde de quinta (fundamental + 5ª) | Sin 3ª, así que sirve igual para riffs mayores y menores. |

### `6`

| | Name | Description |
| --- | --- | --- |
| **en** | Major 6th | Major triad with an added 6th. |
| **ko** | 메이저 6 | 장3화음에 6음을 더한 코드. |
| **ja** | メジャー6th | メジャートライアドに6度を加えたコード。 |
| **zh-Hans** | 大六和弦 | 大三和弦加上六度。 |
| **zh-Hant** | 大六和弦 | 大三和弦加上六度。 |
| **es** | Sexta mayor | Tríada mayor con una 6ª añadida. |

### `7`

| | Name | Description |
| --- | --- | --- |
| **en** | Dominant 7th | Major triad with a flat 7th. The blues and dominant-function chord. |
| **ko** | 도미넌트 7 | 장3화음에 단7도. 블루스와 딸림 기능의 코드입니다. |
| **ja** | ドミナント7th | メジャートライアドに短7度。ブルースとドミナント機能のコードです。 |
| **zh-Hans** | 属七和弦 | 大三和弦配小七度，布鲁斯与属功能的和弦。 |
| **zh-Hant** | 屬七和弦 | 大三和弦配小七度，藍調與屬功能的和弦。 |
| **es** | Séptima de dominante | Tríada mayor con 7ª menor. El acorde del blues y de función dominante. |

### `9`

| | Name | Description |
| --- | --- | --- |
| **en** | Dominant 9th | Dominant 7th with a 9th. |
| **ko** | 도미넌트 9 | 도미넌트 7에 9음을 더한 코드. |
| **ja** | ドミナント9th | ドミナント7thに9度を加えたコード。 |
| **zh-Hans** | 属九和弦 | 属七和弦加九度。 |
| **zh-Hant** | 屬九和弦 | 屬七和弦加九度。 |
| **es** | Novena de dominante | Séptima de dominante con una 9ª. |

### `maj`

| | Name | Description |
| --- | --- | --- |
| **en** | Major | Root, major 3rd, perfect 5th. |
| **ko** | 메이저 | 근음, 장3도, 완전5도. |
| **ja** | メジャー | ルート、長3度、完全5度。 |
| **zh-Hans** | 大三和弦 | 根音、大三度、纯五度。 |
| **zh-Hant** | 大三和弦 | 根音、大三度、完全五度。 |
| **es** | Mayor | Fundamental, 3ª mayor, 5ª justa. |

### `min`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor | Root, minor 3rd, perfect 5th. |
| **ko** | 마이너 | 근음, 단3도, 완전5도. |
| **ja** | マイナー | ルート、短3度、完全5度。 |
| **zh-Hans** | 小三和弦 | 根音、小三度、纯五度。 |
| **zh-Hant** | 小三和弦 | 根音、小三度、完全五度。 |
| **es** | Menor | Fundamental, 3ª menor, 5ª justa. |

### `dim`

| | Name | Description |
| --- | --- | --- |
| **en** | Diminished | Root, minor 3rd, diminished 5th. |
| **ko** | 디미니시드 | 근음, 단3도, 감5도. |
| **ja** | ディミニッシュ | ルート、短3度、減5度。 |
| **zh-Hans** | 减三和弦 | 根音、小三度、减五度。 |
| **zh-Hant** | 減三和弦 | 根音、小三度、減五度。 |
| **es** | Disminuido | Fundamental, 3ª menor, 5ª disminuida. |

### `aug`

| | Name | Description |
| --- | --- | --- |
| **en** | Augmented | Root, major 3rd, augmented 5th. |
| **ko** | 오그멘티드 | 근음, 장3도, 증5도. |
| **ja** | オーギュメント | ルート、長3度、増5度。 |
| **zh-Hans** | 增三和弦 | 根音、大三度、增五度。 |
| **zh-Hant** | 增三和弦 | 根音、大三度、增五度。 |
| **es** | Aumentado | Fundamental, 3ª mayor, 5ª aumentada. |

### `m6`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor 6th | Minor triad with an added 6th. |
| **ko** | 마이너 6 | 단3화음에 6음을 더한 코드. |
| **ja** | マイナー6th | マイナートライアドに6度を加えたコード。 |
| **zh-Hans** | 小六和弦 | 小三和弦加上六度。 |
| **zh-Hant** | 小六和弦 | 小三和弦加上六度。 |
| **es** | Sexta menor | Tríada menor con una 6ª añadida. |

### `maj7`

| | Name | Description |
| --- | --- | --- |
| **en** | Major 7th | Major triad with a natural 7th. |
| **ko** | 메이저 7 | 장3화음에 장7도. |
| **ja** | メジャー7th | メジャートライアドに長7度。 |
| **zh-Hans** | 大七和弦 | 大三和弦配大七度。 |
| **zh-Hant** | 大七和弦 | 大三和弦配大七度。 |
| **es** | Séptima mayor | Tríada mayor con 7ª mayor. |

### `m7`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor 7th | Minor triad with a flat 7th. |
| **ko** | 마이너 7 | 단3화음에 단7도. |
| **ja** | マイナー7th | マイナートライアドに短7度。 |
| **zh-Hans** | 小七和弦 | 小三和弦配小七度。 |
| **zh-Hant** | 小七和弦 | 小三和弦配小七度。 |
| **es** | Séptima menor | Tríada menor con 7ª menor. |

### `m7b5`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor 7th flat 5 (half-diminished) | Diminished triad with a flat 7th. The ii chord of a minor key. |
| **ko** | 마이너 7 플랫 5 (하프 디미니시드) | 감3화음에 단7도. 단조의 ii 코드입니다. |
| **ja** | マイナー7thフラット5（ハーフディミニッシュ） | 減三和音に短7度。短調の ii のコードです。 |
| **zh-Hans** | 半减七和弦（m7b5） | 减三和弦配小七度，小调中的 ii 级和弦。 |
| **zh-Hant** | 半減七和弦（m7b5） | 減三和弦配小七度，小調中的 ii 級和弦。 |
| **es** | Séptima menor con quinta bemol (semidisminuido) | Tríada disminuida con 7ª menor. El acorde ii de una tonalidad menor. |

### `dim7`

| | Name | Description |
| --- | --- | --- |
| **en** | Diminished 7th | Fully diminished: a stack of minor 3rds. |
| **ko** | 디미니시드 7 | 완전 감화음. 단3도를 쌓아 올린 코드입니다. |
| **ja** | ディミニッシュ7th | 完全な減七の和音。短3度を積み重ねた形です。 |
| **zh-Hans** | 减七和弦 | 完全减和弦，由小三度叠置而成。 |
| **zh-Hant** | 減七和弦 | 完全減和弦，由小三度疊置而成。 |
| **es** | Séptima disminuida | Totalmente disminuido: una pila de terceras menores. |

### `mMaj7`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor major 7th | Minor triad with a natural 7th. |
| **ko** | 마이너 메이저 7 | 단3화음에 장7도. |
| **ja** | マイナーメジャー7th | マイナートライアドに長7度。 |
| **zh-Hans** | 小大七和弦 | 小三和弦配大七度。 |
| **zh-Hant** | 小大七和弦 | 小三和弦配大七度。 |
| **es** | Menor con séptima mayor | Tríada menor con 7ª mayor. |

### `7sus4`

| | Name | Description |
| --- | --- | --- |
| **en** | Dominant 7th suspended 4th | The 3rd replaced by the 4th, over a flat 7th. |
| **ko** | 7 서스펜디드 4 | 3음을 4음으로 바꾸고 단7도를 얹은 코드. |
| **ja** | 7thサスペンデッド4th | 3度を4度に置き換え、短7度を乗せたコード。 |
| **zh-Hans** | 属七挂四和弦 | 以四度替换三度，再加小七度。 |
| **zh-Hant** | 屬七掛四和弦 | 以四度取代三度，再加小七度。 |
| **es** | Séptima con cuarta suspendida | La 3ª sustituida por la 4ª, sobre una 7ª menor. |

### `sus2`

| | Name | Description |
| --- | --- | --- |
| **en** | Suspended 2nd | The 3rd replaced by the 2nd. Neither major nor minor. |
| **ko** | 서스펜디드 2 | 3음을 2음으로 바꾼 코드. 장조도 단조도 아닙니다. |
| **ja** | サスペンデッド2nd | 3度を2度に置き換えたコード。長調でも短調でもありません。 |
| **zh-Hans** | 挂二和弦 | 以二度替换三度，既非大调也非小调。 |
| **zh-Hant** | 掛二和弦 | 以二度取代三度，既非大調也非小調。 |
| **es** | Segunda suspendida | La 3ª sustituida por la 2ª. Ni mayor ni menor. |

### `sus4`

| | Name | Description |
| --- | --- | --- |
| **en** | Suspended 4th | The 3rd replaced by the 4th. Wants to resolve down to the 3rd. |
| **ko** | 서스펜디드 4 | 3음을 4음으로 바꾼 코드. 3음으로 내려 해결하려 합니다. |
| **ja** | サスペンデッド4th | 3度を4度に置き換えたコード。3度へ解決したがります。 |
| **zh-Hans** | 挂四和弦 | 以四度替换三度，倾向下行解决到三度。 |
| **zh-Hant** | 掛四和弦 | 以四度取代三度，傾向下行解決到三度。 |
| **es** | Cuarta suspendida | La 3ª sustituida por la 4ª. Tiende a resolver bajando a la 3ª. |

### `5oct`

| | Name | Description |
| --- | --- | --- |
| **en** | Power chord (root + 5th + octave) | The three-string power chord shape, octave on top. |
| **ko** | 파워 코드 (근음 + 5도 + 옥타브) | 세 현을 쓰는 파워 코드 폼. 위에 옥타브가 붙습니다. |
| **ja** | パワーコード（ルート＋5度＋オクターブ） | 3弦を使うパワーコードの形。上にオクターブが付きます。 |
| **zh-Hans** | 强力和弦（根音＋五度＋八度） | 三根弦的强力和弦指型，上方加一个八度。 |
| **zh-Hant** | 強力和弦（根音＋五度＋八度） | 三條弦的強力和弦指型，上方加一個八度。 |
| **es** | Acorde de quinta (fundamental + 5ª + octava) | La posición de tres cuerdas, con la octava arriba. |

### `add9`

| | Name | Description |
| --- | --- | --- |
| **en** | Added 9th | Major triad with a 9th added but no 7th. |
| **ko** | 애드 9 | 장3화음에 7음 없이 9음만 더한 코드. |
| **ja** | アド9th | メジャートライアドに7度を加えず9度だけを足したコード。 |
| **zh-Hans** | 加九和弦 | 大三和弦加九度，但不加七度。 |
| **zh-Hant** | 加九和弦 | 大三和弦加九度，但不加七度。 |
| **es** | Con novena añadida | Tríada mayor con una 9ª añadida pero sin 7ª. |

### `m9`

| | Name | Description |
| --- | --- | --- |
| **en** | Minor 9th | Minor 7th with a 9th. |
| **ko** | 마이너 9 | 마이너 7에 9음을 더한 코드. |
| **ja** | マイナー9th | マイナー7thに9度を加えたコード。 |
| **zh-Hans** | 小九和弦 | 小七和弦加九度。 |
| **zh-Hant** | 小九和弦 | 小七和弦加九度。 |
| **es** | Novena menor | Séptima menor con una 9ª. |

### `maj9`

| | Name | Description |
| --- | --- | --- |
| **en** | Major 9th | Major 7th with a 9th. |
| **ko** | 메이저 9 | 메이저 7에 9음을 더한 코드. |
| **ja** | メジャー9th | メジャー7thに9度を加えたコード。 |
| **zh-Hans** | 大九和弦 | 大七和弦加九度。 |
| **zh-Hant** | 大九和弦 | 大七和弦加九度。 |
| **es** | Novena mayor | Séptima mayor con una 9ª. |

## Group headings

*Headings that group the scale and chord menus.*

| Key | en | ko | ja | zh-Hans | zh-Hant | es |
| --- | --- | --- | --- | --- | --- | --- |
| `Major / minor` | Major / minor | 장조 / 단조 | 長調 / 短調 | 大调 / 小调 | 大調 / 小調 | Mayor / menor |
| `Modes` | Modes | 모드 | モード | 调式 | 調式 | Modos |
| `Pentatonic` | Pentatonic | 5음 음계 | ペンタトニック | 五声音阶 | 五聲音階 | Pentatónicas |
| `Blues` | Blues | 블루스 | ブルース | 布鲁斯 | 藍調 | Blues |
| `Symmetric` | Symmetric | 대칭 음계 | 対称音階 | 对称音阶 | 對稱音階 | Simétricas |
| `Exotic` | Exotic | 이국적 음계 | 特徴的な音階 | 特色音阶 | 特色音階 | Exóticas |
| `Triads` | Triads | 3화음 | 三和音 | 三和弦 | 三和弦 | Tríadas |
| `Sevenths` | Sevenths | 7화음 | 七の和音 | 七和弦 | 七和弦 | Séptimas |
| `Suspended` | Suspended | 서스펜디드 | サスペンデッド | 挂留和弦 | 掛留和弦 | Suspendidos |
| `Power` | Power | 파워 코드 | パワーコード | 强力和弦 | 強力和弦 | De quinta |
| `Extended` | Extended | 텐션 코드 | テンションコード | 延伸和弦 | 延伸和弦 | Extendidos |

## Tuning presets

*Names in the tuning menu. The open-string letters are added by the application.*

| Key | en | ko | ja | zh-Hans | zh-Hant | es |
| --- | --- | --- | --- | --- | --- | --- |
| `standard` | Standard | 표준 | レギュラー | 标准调弦 | 標準調弦 | Estándar |
| `half-down` | Half step down | 반음 내림 | 半音下げ | 降半音 | 降半音 | Medio tono abajo |
| `d-standard` | D standard (whole step down) | D 표준 (온음 내림) | D レギュラー (全音下げ) | D 标准调弦（降全音） | D 標準調弦（降全音） | D estándar (un tono abajo) |
| `c-sharp-standard` | C# standard | C# 표준 | C# レギュラー | C# 标准调弦 | C# 標準調弦 | C# estándar |
| `drop-d` | Drop D | 드롭 D | ドロップ D | 降 D 调弦 | 降 D 調弦 | Drop D |
| `drop-c-sharp` | Drop C# | 드롭 C# | ドロップ C# | 降 C# 调弦 | 降 C# 調弦 | Drop C# |
| `drop-c` | Drop C | 드롭 C | ドロップ C | 降 C 调弦 | 降 C 調弦 | Drop C |
| `drop-b` | Drop B | 드롭 B | ドロップ B | 降 B 调弦 | 降 B 調弦 | Drop B |
| `drop-a` | Drop A | 드롭 A | ドロップ A | 降 A 调弦 | 降 A 調弦 | Drop A |
| `open-g` | Open G | 오픈 G | オープン G | G 开放调弦 | G 開放調弦 | Sol abierto |
| `open-d` | Open D | 오픈 D | オープン D | D 开放调弦 | D 開放調弦 | Re abierto |
| `open-e` | Open E | 오픈 E | オープン E | E 开放调弦 | E 開放調弦 | Mi abierto |
| `dadgad` | DADGAD | DADGAD | DADGAD | DADGAD | DADGAD | DADGAD |
| `bead` | BEAD (low B) | BEAD (저음 B) | BEAD (低音 B) | BEAD（低音 B） | BEAD（低音 B） | BEAD (B grave) |
| `tenor` | Tenor | 테너 | テナー | 高音调弦 | 高音調弦 | Tenor |
| `custom` | Custom | 사용자 지정 | カスタム | 自定义 | 自訂 | Personalizada |

## Why a scale fits a chord

*Tooltip on each suggested scale in Chord mode. Keyed by scale.*

| Key | en | ko | ja | zh-Hans | zh-Hant | es |
| --- | --- | --- | --- | --- | --- | --- |
| `major` | contains the chord tones and resolves to the root | 코드 구성음을 포함하고 으뜸음으로 해결됩니다 | コードの構成音を含み、ルートへ解決します | 包含该和弦的全部音，并解决到主音 | 包含該和弦的全部音，並解決到主音 | contiene las notas del acorde y resuelve en la fundamental |
| `major-pentatonic` | safe five-note subset, no half steps | 반음이 없는 안전한 5음 선택 | 半音を含まない安全な5音の選択 | 不含半音的安全五音选择 | 不含半音的安全五音選擇 | subconjunto seguro de cinco notas, sin semitonos |
| `minor-pentatonic` | the standard rock and blues choice | 록과 블루스의 기본 선택 | ロックとブルースの定番 | 摇滚与布鲁斯的标准选择 | 搖滾與藍調的標準選擇 | la elección habitual en rock y blues |
| `blues` | adds the blue note over the chord | 코드 위에 블루 노트를 더합니다 | コードの上にブルーノートを加えます | 在和弦之上加入蓝调音 | 在和弦之上加入藍調音 | añade la blue note sobre el acorde |
| `mixolydian` | major sound with the flat 7th of the chord | 코드의 단7도를 살린 장조 느낌 | コードの短7度を生かした長調の響き | 带有该和弦小七度的大调色彩 | 帶有該和弦小七度的大調色彩 | sonido mayor con la 7ª menor del acorde |
| `dorian` | minor sound with a bright natural 6th | 밝은 장6도가 있는 단조 느낌 | 明るい長6度をもつ短調の響き | 带明亮大六度的小调色彩 | 帶明亮大六度的小調色彩 | sonido menor con una 6ª natural luminosa |
| `phrygian` | darker minor colour, flat 2nd | 단2도로 더 어두운 단조 색채 | 短2度でより暗い短調の色 | 以小二度带来更暗的小调色彩 | 以小二度帶來更暗的小調色彩 | color menor más oscuro, con 2ª rebajada |
| `natural-minor` | plain minor note pool | 기본적인 단조 음 모음 | 素直な短調の音の集まり | 朴素的小调音群 | 樸素的小調音群 | conjunto de notas menor sin adornos |
| `locrian` | the mode built on the chord root for m7b5 | m7b5의 근음 위에 세운 모드 | m7b5 のルート上に立つモード | 建立在 m7b5 根音之上的调式 | 建立在 m7b5 根音之上的調式 | el modo construido sobre la fundamental para m7b5 |
| `lydian` | major with a sharp 4th for an open sound | 증4도로 열린 느낌을 주는 장조 | 増4度で開けた響きの長調 | 带增四度、音响开阔的大调 | 帶增四度、音響開闊的大調 | mayor con 4ª aumentada, de sonido abierto |
| `lydian-dominant` | dominant sound with a sharp 4th | 증4도가 있는 도미넌트 느낌 | 増4度をもつドミナントの響き | 带增四度的属和弦色彩 | 帶增四度的屬和弦色彩 | sonido dominante con 4ª aumentada |
| `altered` | maximum tension over a dominant chord | 도미넌트 위에서 긴장을 최대로 | ドミナント上で緊張を最大に | 在属和弦上制造最大张力 | 在屬和弦上製造最大張力 | máxima tensión sobre un acorde dominante |
| `melodic-minor` | raises the 6th and 7th over a minor chord | 단조 코드 위에서 6음과 7음을 올립니다 | 短調のコード上で6度と7度を上げます | 在小和弦上升高六度与七度 | 在小和弦上升高六度與七度 | eleva la 6ª y la 7ª sobre un acorde menor |
| `harmonic-minor` | raised 7th, matches a dominant V in minor | 7음을 올려 단조의 딸림화음에 맞습니다 | 7度を上げ、短調のドミナント V に合います | 升高七度，契合小调的属和弦 V | 升高七度，契合小調的屬和弦 V | 7ª elevada, encaja con el V dominante en menor |
| `whole-tone` | symmetric match for the augmented 5th | 증5도와 어울리는 대칭 음계 | 増5度に合う対称音階 | 与增五度相配的对称音阶 | 與增五度相配的對稱音階 | correspondencia simétrica con la 5ª aumentada |
| `dim-half-whole` | octatonic option over altered dominants | 얼터드 도미넌트에 쓰는 8음 선택지 | オルタード・ドミナントに使う8音の選択肢 | 用于变化属和弦的八音选择 | 用於變化屬和弦的八音選擇 | opción octatónica sobre dominantes alterados |
| `dim-whole-half` | octatonic match for diminished chords | 감화음에 맞는 8음 음계 | ディミニッシュに合う8音音階 | 与减和弦相配的八音音阶 | 與減和弦相配的八音音階 | escala octatónica que casa con los acordes disminuidos |
| `bebop-dominant` | dominant scale with an extra passing tone | 경과음이 하나 더 있는 도미넌트 음계 | 経過音がもう一つあるドミナント音階 | 多一个经过音的属音阶 | 多一個經過音的屬音階 | escala dominante con una nota de paso más |
| `harmonic-major` | major with a flattened 6th | 6음을 내린 장음계 | 6度を下げた長音階 | 降低六度的大音阶 | 降低六度的大音階 | mayor con la 6ª rebajada |
| `aeolian` | plain minor note pool | 기본적인 단조 음 모음 | 素直な短調の音の集まり | 朴素的小调音群 | 樸素的小調音群 | conjunto de notas menor sin adornos |
| `ionian` | contains the chord tones and resolves to the root | 코드 구성음을 포함하고 으뜸음으로 해결됩니다 | コードの構成音を含み、ルートへ解決します | 包含该和弦的全部音，并解决到主音 | 包含該和弦的全部音，並解決到主音 | contiene las notas del acorde y resuelve en la fundamental |
| `hirajoshi` | shares the chord tones | 코드 구성음을 공유합니다 | コードの構成音を共有します | 与该和弦共用组成音 | 與該和弦共用組成音 | comparte las notas del acorde |
| `major-blues` | shares the chord tones | 코드 구성음을 공유합니다 | コードの構成音を共有します | 与该和弦共用组成音 | 與該和弦共用組成音 | comparte las notas del acorde |
| `chromatic` | every note, as a reference | 모든 음을 기준으로 보여 줍니다 | すべての音を基準として示します | 列出全部十二音作参考 | 列出全部十二音作參考 | todas las notas, como referencia |
| `hungarian-minor` | shares the chord tones | 코드 구성음을 공유합니다 | コードの構成音を共有します | 与该和弦共用组成音 | 與該和弦共用組成音 | comparte las notas del acorde |
| `double-harmonic` | shares the chord tones | 코드 구성음을 공유합니다 | コードの構成音を共有します | 与该和弦共用组成音 | 與該和弦共用組成音 | comparte las notas del acorde |
| `phrygian-dominant` | shares the chord tones | 코드 구성음을 공유합니다 | コードの構成音を共有します | 与该和弦共用组成音 | 與該和弦共用組成音 | comparte las notas del acorde |

---

*360 texts × 6 languages.*
