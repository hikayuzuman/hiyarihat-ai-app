# Care Execution Screen — Design System

> Stitch MCP プロジェクト `Care Execution Screen`（ID: `3570871462107445123`）から抽出

---

## Creative North Star: "The Ethereal Caregiver"

高ファンタジーRPGの美学とプロフェッショナルな介護の温かみを融合させたデザインシステム。冷たく臨床的なヘルスケアソフトウェアを脱し、層のある、輝く、養育的な体験を創出する。

---

## カラーパレット

### カラーモード
- **モード:** Light
- **カラーバリアント:** Vibrant

### ブランドカラー

| ロール | カラーコード | 用途 |
|:---|:---|:---|
| **Primary** | `#3A96A8` | メインアクション、ブランドアイデンティティ |
| **Secondary** | `#A2D2A5` | 補助要素、レクリエーション関連 |
| **Tertiary** | `#F9D423` | 報酬・ハイライト（控えめに使用） |
| **Neutral** | `#F5F1E9` | 背景・サーフェス |
| **Custom Color** | `#76C7C0` | カスタムアクセント |

### Primary パレット

| トークン | カラーコード |
|:---|:---|
| `primary` | `#006F7F` |
| `primary-dim` | `#006170` |
| `primary-container` | `#93EAFD` |
| `primary-fixed` | `#93EAFD` |
| `primary-fixed-dim` | `#85DCEF` |
| `on-primary` | `#FFFFFF` |
| `on-primary-container` | `#005764` |
| `on-primary-fixed` | `#00424D` |
| `on-primary-fixed-variant` | `#00616F` |
| `inverse-primary` | `#93EAFD` |

### Secondary パレット

| トークン | カラーコード |
|:---|:---|
| `secondary` | `#426E49` |
| `secondary-dim` | `#36623D` |
| `secondary-container` | `#BEEFC0` |
| `secondary-fixed` | `#BEEFC0` |
| `secondary-fixed-dim` | `#B0E0B3` |
| `on-secondary` | `#FFFFFF` |
| `on-secondary-container` | `#305B37` |
| `on-secondary-fixed` | `#1D4826` |
| `on-secondary-fixed-variant` | `#3A6540` |

### Tertiary パレット

| トークン | カラーコード |
|:---|:---|
| `tertiary` | `#766300` |
| `tertiary-dim` | `#685700` |
| `tertiary-container` | `#FDD828` |
| `tertiary-fixed` | `#FDD828` |
| `tertiary-fixed-dim` | `#EECA12` |
| `on-tertiary` | `#FFFFFF` |
| `on-tertiary-container` | `#5B4C00` |
| `on-tertiary-fixed` | `#453900` |
| `on-tertiary-fixed-variant` | `#665500` |

### Surface パレット

| トークン | カラーコード |
|:---|:---|
| `surface` | `#FFFBFF` |
| `surface-bright` | `#FFFBFF` |
| `surface-dim` | `#E6E2D8` |
| `surface-variant` | `#ECE8DE` |
| `surface-tint` | `#006F7F` |
| `surface-container-lowest` | `#FFFFFF` |
| `surface-container-low` | `#FDF9F0` |
| `surface-container` | `#F7F3EA` |
| `surface-container-high` | `#F1EEE4` |
| `surface-container-highest` | `#ECE8DE` |
| `on-surface` | `#393833` |
| `on-surface-variant` | `#66645E` |
| `inverse-surface` | `#0F0E0A` |
| `inverse-on-surface` | `#9F9D96` |
| `background` | `#FFFBFF` |
| `on-background` | `#393833` |

### Error パレット

| トークン | カラーコード |
|:---|:---|
| `error` | `#C0262D` |
| `error-dim` | `#9F0519` |
| `error-container` | `#FB5151` |
| `on-error` | `#FFFFFF` |
| `on-error-container` | `#570008` |

### Outline

| トークン | カラーコード |
|:---|:---|
| `outline` | `#83807A` |
| `outline-variant` | `#BCB9B2` |

---

## 書体（Typography）

### フォントファミリー

| ロール | フォント |
|:---|:---|
| **見出し（Headline）** | Plus Jakarta Sans |
| **本文（Body）** | Be Vietnam Pro |
| **ラベル（Label）** | Be Vietnam Pro |

### タイポグラフィの使い分け

| カテゴリ | フォント | 用途 |
|:---|:---|:---|
| Display & Headline | Plus Jakarta Sans | キャラクター名、大きなステータス数値、世界観の構築 |
| Title & Body | Be Vietnam Pro | クエストログ、タスク説明、日常的なテキスト |

### テキストカラーの階層

| 目的 | トークン | カラー |
|:---|:---|:---|
| **プライマリテキスト** | `on-surface` | `#393833`（純黒 #000000 は使用禁止） |
| **セカンダリテキスト** | `on-surface-variant` | `#66645E` |

---

## シェイプ（Shape）

| 属性 | 値 |
|:---|:---|
| **角丸** | Full Round（`rounded-full`） |
| **スペーシングスケール** | 2 |

---

## デザインルール

### Do（推奨事項）
- ✅ 非対称レイアウトで、キャラクターやアイコンがコンテナの端を越える配置
- ✅ `rounded-xl` / `rounded-lg` でコンテナの優しい雰囲気を維持
- ✅ スペーシング `8`〜`10` でテキスト密度の高い介護タスクに余白を確保
- ✅ Tertiary（ゴールド/イエロー）は報酬カラーとして控えめに使用
- ✅ Surface 階層のネストで自然な奥行きを表現

### Don't（禁止事項）
- ❌ 純黒 `#000000` をテキストに使用しない（`on-surface` #393833 を使用）
- ❌ `1px solid` ボーダーでセクション分割しない（背景色の切り替えで表現）
- ❌ デフォルトのシステムシャドウを使用しない（ペインタリーな美学と不一致）
- ❌ 要素を詰め込まない（「明確さは思いやり」）

### グラスモーフィズム
- RPG HUD や浮遊モーダルには `surface-variant` を 70-80% 不透明度 + 背景ブラー（10px〜20px）で使用

### シグネチャーグラデーション
- CTA やステータスバーには `primary`（#006F7F）→ `primary-container`（#93EAFD）の微細なグラデーションを適用

### ゴーストボーダー
- アクセシビリティ上ボーダーが必要な場合、`outline-variant` を 15% 不透明度で使用（100% 不透明ボーダー禁止）
