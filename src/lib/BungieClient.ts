import type { BungieHttpProtocol } from "bungie-net-core";
import {
  AllDestinyManifestComponents,
  getDestinyManifestComponent,
} from "bungie-net-core/manifest";
import {
  getDestinyManifest,
  getProfile,
} from "bungie-net-core/endpoints/Destiny2";
import {
  BungieMembershipType,
  BungieNetResponse,
  DestinyManifest,
} from "bungie-net-core/models";
import { getMembershipDataForCurrentUser } from "bungie-net-core/endpoints/User";

const getCookie = (name: string) => {
  return (
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split("=")[1] ?? ""
  );
};

export class BungieHttpClient {
  private platformHttp: BungieHttpProtocol = async (config) => {
    const headers = new Headers({
      "x-csrf": getCookie("bungled"),
      "X-API-Key": import.meta.env.VITE_BUNGIE_API_KEY!,
    });

    if (config.contentType) {
      headers.set("Content-Type", config.contentType);
    }

    const url =
      config.baseUrl + (config.searchParams ? `?${config.searchParams}` : "");

    const response = await fetch(url, {
      credentials: "include",
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (response.headers.get("Content-Type")?.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message, {
          cause: data,
        });
      }

      return data;
    } else {
      throw new Error(response.statusText, {
        cause: response,
      });
    }
  };

  private manifestComponentHttp: BungieHttpProtocol = async (config) => {
    const response = await fetch(config.baseUrl, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (response.headers.get("Content-Type")?.includes("application/json")) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message, {
          cause: data,
        });
      }

      return data;
    } else {
      throw new Error(response.statusText, {
        cause: response,
      });
    }
  };

  async getManifest() {
    return await getDestinyManifest(this.platformHttp).then(
      (res) => res.Response
    );
  }

  async getManifestComponent<T extends keyof AllDestinyManifestComponents>(
    tableName: T,
    destinyManifest: DestinyManifest
  ) {
    return await getDestinyManifestComponent(this.manifestComponentHttp, {
      language: "en",
      tableName,
      destinyManifest,
    });
  }

  async getMembershipData() {
    return await getMembershipDataForCurrentUser(this.platformHttp).then(
      (res) => res.Response
    );
  }

  async getProfileProgressions(params: {
    destinyMembershipId: string;
    membershipType: BungieMembershipType;
  }) {
    return await getProfile(this.platformHttp, {
      destinyMembershipId: params.destinyMembershipId,
      membershipType: params.membershipType,
      components: [200, 202],
    }).then((res) => res.Response);
  }

  async claimSeasonPassReward(params: {
    characterId: string;
    membershipType: BungieMembershipType;
    rewardIndex: number;
    seasonHash: number;
    progressionHash: number;
  }) {
    const response: BungieNetResponse<unknown> = await this.platformHttp({
      baseUrl:
        "https://www.bungie.net/Platform/Destiny2/Actions/Seasons/ClaimReward/",
      method: "POST",
      contentType: "application/json",
      body: params,
    });

    return response.Response;
  }
}
