import { NextRequest, NextResponse } from 'next/server';
import { cacheFunction, cacheType } from '@/utils/AllData/githubClient';

export const revalidate = 0;

export async function GET({ nextUrl: { searchParams } }: NextRequest) {
    try {
        const type: cacheType = JSON.parse(
            `["${searchParams.get('type') ?? ''}"]`
        )[0];
        const args: [] = JSON.parse(searchParams.get('args') || '[]');
        if (!type || !(type in cacheFunction)) {
            console.log('wrong type name');
            return NextResponse.json({
                succeed: false,
                message: 'wrong type name',
            });
        }
        let data = await cacheFunction[type](...args);
        console.log(`route API githubFetch: ${type} / ${args}`);
        return NextResponse.json({ succeed: true, message: data });
    } catch (e) {
        console.log('co loi in githubFetch/route (error): ', e);
        return NextResponse.json({ succeed: false, message: null });
    }
}
