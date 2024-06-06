import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

const REFETCH_PG_CONTENT = process.env.REFETCH_PG_CONTENT;

export async function GET(request: NextRequest) {
    try {
        revalidateTag('fetchNavData');
        revalidateTag('fetchPageCommitDetails');
        revalidateTag('fetchParamsPairObj');

        if (REFETCH_PG_CONTENT == 'true') {
            revalidateTag('fetchPageContent');
            console.log('REFETCH_PG_CONTENT ok');
        }

        console.log('REFETCH_PG_CONTENT is', REFETCH_PG_CONTENT == 'true');
        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
        });
    } catch (e) {
        console.log('revalidatetag (error): ', e);
        return NextResponse.json({ message: [] }, { status: 400 });
    }
}
