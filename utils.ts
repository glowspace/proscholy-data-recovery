// Almost every table in the Laravel DB has these two columns.
export function dates() {
    return {
        updated_at: new Date(),
        created_at: new Date(),
    }
}