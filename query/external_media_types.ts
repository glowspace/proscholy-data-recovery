import { mobile_data } from "../mobile_data/mobile_data";

const media_type__media_ids: Map<number, string[]> = new Map();

const push_or_create = (media_type: number, media_id: string) => {
    if (!media_type__media_ids.has(media_type)) {
        media_type__media_ids.set(media_type, []);
    }
    media_type__media_ids.get(media_type)?.push(media_id);
}

for (const external of mobile_data.externals) {
    if (external.url == null) {
        continue;
    }
    push_or_create(external.media_type, external.url);
}

for (const [media_type, media_ids] of media_type__media_ids.entries()) {
    console.log('Media type', media_type, ':', media_ids.slice(0, 5).join(','));
}