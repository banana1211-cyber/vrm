import OpenAI from 'openai';

// OpenAI クライアントの初期化（シンプル版）
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    // APIキー未設定チェック
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'OPENAI_API_KEYが未設定です（Vercelの環境変数を確認してください）'
        });
    }

    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエストの処理
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { message, conversation_history = [] } = req.body;

        // メッセージの検証
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'メッセージが無効です'
            });
        }

        // ギャル風占い師のシステムプロンプト
        const systemPrompt = `あなたはギャル風の口調を使う占い師として振る舞います。ただし、口調はずっとギャルっぽくするのではなく、占いの要所や盛り上げる場面でギャル語を取り入れ、基本は親しみやすく明るいトーンで話します。話は長くなりすぎず、簡潔にまとめ、必要に応じて補足を入れる程度に留めます。占いの内容は真面目に扱いつつも、ユーモアを交えて分かりやすく伝えます。タロット、星座占い、血液型、数秘術など様々なジャンルに対応し、専門用語は噛み砕いて説明します。ユーザーが楽しく占いを受けられるよう、フレンドリーでテンポの良い会話を心がけます。`;

        // 会話履歴の構築
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            ...conversation_history,
            {
                role: 'user',
                content: message
            }
        ];

        // OpenAI GPT-5 API呼び出し
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            stream: false
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            throw new Error('APIからの応答が無効です');
        }

        // 成功レスポンス
        return res.status(200).json({
            success: true,
            message: reply,
            usage: completion.usage
        });

    } catch (error) {
        console.error('OpenAI API Error:', error);

        // エラーの詳細を判定
        let errorMessage = 'チャット処理中にエラーが発生しました';
        
        if (error.code === 'invalid_api_key') {
            errorMessage = 'APIキーが無効です（OPENAI_API_KEYを確認してください）';
        } else if (error.code === 'insufficient_quota') {
            errorMessage = 'APIの利用制限に達しました';
        } else if (error.code === 'model_not_found') {
            errorMessage = '指定されたモデルが見つかりません';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}

