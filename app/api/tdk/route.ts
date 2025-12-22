import { NextResponse } from 'next/server';

// Dynamic import for creart-tdk (CommonJS module)
let TDKSozluk: any = null;

async function getTDKInstance() {
    if (!TDKSozluk) {
        const module = await import('creart-tdk');
        TDKSozluk = module.default || module;
    }
    return new TDKSozluk({ cache: true, timeout: 15000 });
}

interface TDKData {
    definition?: string;
    type?: string;
    etymology?: string;
    examples?: string[];
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
        return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    try {
        const tdk = await getTDKInstance();
        const result = await tdk.ara(word);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Word not found' }, { status: 404 });
        }

        const data = result.data;

        // Extract relevant information
        const tdkData: TDKData = {
            definition: data.anlamlar?.[0]?.anlam || '',
            type: data.temelBilgiler?.kullanimTuru || data.kullanimTuru?.[0] || '',
            etymology: data.etimoloji?.aciklama || data.temelBilgiler?.lisan || '',
            examples: data.ornekler?.slice(0, 3) || [],
        };

        return NextResponse.json({
            source: 'tdk',
            word,
            data: tdkData,
            success: true
        });

    } catch (error) {
        console.error('TDK API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from TDK' },
            { status: 500 }
        );
    }
}
