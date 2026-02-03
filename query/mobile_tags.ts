import { mobile_data } from "../mobile_data/mobile_data";

const tag_type__names: Map<number, string[]> = new Map();

for (const tag of mobile_data.tags) {
    const type_enum = tag.type_enum;
    if (!tag_type__names.has(type_enum)) {
        tag_type__names.set(type_enum, []);
    }
    tag_type__names.get(type_enum)!.push(tag.name);
}

console.log(tag_type__names);