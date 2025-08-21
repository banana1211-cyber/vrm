# VRMキャラクターチャットアプリ - Vercel版

VRMキャラクターとChatGPTを連携したチャットアプリケーションのVercel版です。

## 🚀 機能

- **VRMキャラクター表示**: 3D VRMキャラクターの表示
- **VRMAアニメーション**: 感情に応じたアニメーション再生
- **ChatGPT連携**: OpenAI ChatGPT APIを使用した自然な会話
- **音声合成**: にじボイスAPIを使用した音声生成
- **口パク機能**: 音声再生と同期した口の動き

## 📦 技術スタック

- **フロントエンド**: Three.js, VRM SDK
- **バックエンド**: Vercel サーバーレス関数
- **AI**: OpenAI ChatGPT API
- **音声**: にじボイス API
- **ホスティング**: Vercel

## 🛠️ Vercelデプロイ手順

### 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
NIJIVOICE_API_KEY=your_nijivoice_api_key
NIJIVOICE_CHARACTER_ID=your_character_id
```

### 2. デプロイコマンド

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトディレクトリに移動
cd vrm-chat-vercel

# 依存関係をインストール
npm install

# Vercelにデプロイ
vercel --prod
```

### 3. 自動デプロイ

GitHubリポジトリと連携することで、プッシュ時の自動デプロイが可能です。

## 📁 プロジェクト構造

```
vrm-chat-vercel/
├── api/
│   ├── chat.js          # ChatGPT連携API
│   └── speak.js         # 音声合成API
├── assets/
│   ├── vrm/            # VRMファイル
│   └── vrma/           # VRMAアニメーションファイル
├── index.html          # メインページ
├── style.css           # スタイルシート
├── package.json        # 依存関係
├── vercel.json         # Vercel設定
└── README.md           # このファイル
```

## 🎯 APIエンドポイント

### チャットAPI
- **URL**: `/api/chat`
- **Method**: POST
- **Body**: `{ "message": "ユーザーメッセージ", "conversation_history": [] }`

### 音声合成API
- **URL**: `/api/speak`
- **Method**: POST
- **Body**: `{ "message": "発話内容", "emotion": "greeting" }`

## 💰 コスト

- **Vercel**: 無料プラン利用可能
- **OpenAI API**: 使用量に応じた従量課金
- **にじボイス API**: 使用量に応じた従量課金

## 🔧 カスタマイズ

- VRMファイルの変更: `assets/vrm/`ディレクトリ
- アニメーションの追加: `assets/vrma/`ディレクトリ
- キャラクター設定: `api/chat.js`の`CHARACTER_SETTINGS`
- 音声パラメータ: `api/speak.js`の`emotionVoiceMap`

## 📝 ライセンス

MIT License

