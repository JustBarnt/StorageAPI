import { browser } from "$app/environment";
import { generateRandomToken } from "$lib/modules/Helpers";

/** Provided default expiration of a week */
export const DefaultExpiration = { creationDate: new Date(), expiresIn: 3600 * (24 * 7) } satisfies ExpireProps;

/** Constrains the value passed in the constructor so on local or session can get passed. */
declare type StorageType = "local" | "session";

/** Used to constrain that the return value from the StorageAPI satisfies the return type */
declare type ValidItem<T> = { value: T, expires?: number };

/** Used for saving items that don't expire */
declare type Item<T> = { value: T };

/** Contrains expires properties */
declare type ExpireProps = { creationDate: Date, expiresIn: number };

/** Used for items that do expire and need additional options */
declare type ItemWithExpiry<T> = { value: T, expires: ExpireProps };


/** Creates an instance of the StorageAPI and allows users to save data with either an expiration or persistently */
export class StorageAPI
{
    private storage;
    
    constructor(storageType?: StorageType)
    {
        this.storage = storageType ?? "local";
    }

    /**
    * Saves Key value pair to the StorageAPI in the browser
    * @param  key - The key name to give the item
    * @param item - Generical value that pairs with the `key` to save to the StorageAPI
    * @param ItemWithExpiry - Must contain `{ value:T , expires: { creationDate: Date, expiresIn: number } }`
    * @example 
    * ```
    * const local = new StoreAPI({ storage: "local" });
    * local.SaveItemWithExpiration("test", { value: false, expires: { creationDate: new Date().now, expiresIn: 84000 } });
    * ```
    */
    public SaveItemWithExpiration<T>(key: string, item: ItemWithExpiry<T>): void
    {
        if(!browser) return;

        const storage = this.storage === "local" ? localStorage : sessionStorage;
        const creationDate = item.expires.creationDate;
        const expiresIn = item.expires.expiresIn;
        const kvp = { value: item.value, expires: creationDate.getTime() + expiresIn } satisfies ValidItem<T>;

        storage.setItem(key, JSON.stringify(kvp));
    }

    /**
    * Saves Key value pair to the StorageAPI in the browser
    * @param  key - The key name to give the item
    * @param item - Generical value that pairs with the `key` to save to the StorageAPI
    * @example 
    * ```
    * const local = new StoreAPI({ storage: "local" });
    * local.SaveItem("test", { value: false });
    * ```
    */
    public SaveItem<T>(key: string, item: Item<T>): void
    {
        if(!browser) return;

        const storage = this.storage === "local" ? localStorage : sessionStorage;
        storage.setItem(key, JSON.stringify(item.value));
    }

    /**
    * Returns the value from the StorageAPI if found
    * @param  key - The key name to give the item
    * @example 
    * ```
    * const local = new StoreAPI({ storage: "local" });
    * const item = local.GetItem("test");
    * ```
    * @return The value from the StorageAPI if found
    */
    public GetItem<T>(key: string): T | null
    {
        if(!browser) return null;

        const storage = this.storage === "local" ? localStorage : sessionStorage;
        const stringValue = storage.getItem(key);

        if(!stringValue) return null;

        const item: ValidItem<T> = JSON.parse(stringValue);
        const currentTime = new Date();

        if(item?.expires)
        {
            if(currentTime.getTime() > item.expires)
            {
                storage.removeItem(key);
                return null;
            }    
        }

        return item.value;
    }

    /**
    * Returns if true if the StorageAPI contains the key, or false if it does not
    * @param  key - The key to check for
    * @return returns a boolean
    */
    public Contains(key: string): boolean
    {
        const storage = this.storage === "local" ? localStorage : sessionStorage;

        return storage.getItem(key) !== null;
    }

    /** Clears the selected StorageAPI */
    public Clear(): boolean
    {
        const storage = this.storage === "local" ? localStorage : sessionStorage;

        storage.clear();

        return true;
    }
}

/** specific typing contraits for what SessionData needs to be and can have */
type SessionData = { selector: string, validator?: string, userId?: number, userName?: string, expires?: number, token: string };

/**
 * Sets session storage and local storage for the user
 * @param {SessionData} user - the session data to be stored
 */

export function SaveUserSession(user: User, rememberMe: boolean): void
{
    const storage = new StorageAPI();
    let tokens: [string, string] = [generateRandomToken(12), generateRandomToken(32)];
    
    storage.SaveItemWithExpiration("name", { value: `${user.firstName} ${user.lastName}`, expires: DefaultExpiration });
    storage.SaveItemWithExpiration("username", { value: user.username, expires: DefaultExpiration } );
    storage.SaveItemWithExpiration("token", { value: user.token, expires: DefaultExpiration });
    storage.SaveItemWithExpiration("selector", { value: tokens[0], expires: DefaultExpiration });
    
    rememberMe
        ? storage.SaveItemWithExpiration("validator", { value: tokens[1], expires: DefaultExpiration })
        : new StorageAPI("session").SaveItem("validator", { value: tokens[1] });
}