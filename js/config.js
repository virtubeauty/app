// config.js
const API_CONFIG = {
    prototype: {
        url: 'https://api.virtuals.io/api/virtuals',
        params: {
            'filters[status]': 'UNDERGRAD',
            'filters[priority][$ne]': '-1',
            'sort[0]': 'virtualTokenValue:desc',
            'sort[1]': 'createdAt:desc',
            'populate[0]': 'image',
            'pagination[pageSize]': '66'
        }
    },
    latest: {
        url: 'https://api.virtuals.io/api/virtuals',
        params: {
            'filters[status]': 'UNDERGRAD',
            'filters[priority][$ne]': '-1',
            'sort[0]': 'createdAt:desc',
            'sort[1]': 'createdAt:desc',
            'populate[0]': 'image',
            'pagination[pageSize]': '66'
        }
    },
    sentient: {
        url: 'https://api.virtuals.io/api/virtuals',
        params: {
            'filters[status][$in][0]': 'AVAILABLE',
            'filters[status][$in][1]': 'ACTIVATING',
            'filters[priority][$ne]': '-1',
            'sort[0]': 'totalValueLocked:desc',
            'sort[1]': 'createdAt:desc',
            'populate[0]': 'image',
            'pagination[pageSize]': '66'
        }
    },
    favorites: {
        url: 'https://api.virtuals.io/api/virtuals',
        params: {
            'filters[priority][$ne]': '-1',
            'sort[0]': 'totalValueLocked:desc',
            'sort[1]': 'createdAt:desc',
            'populate[0]': 'image',
            'pagination[pageSize]': '20'
        }
    },
    voting: {
        //baseUrl: 'https://localhost:7162',
        baseUrl: 'https://virtubeautyapi-bkd2axcgg5ejfehj.germanywestcentral-01.azurewebsites.net',
        endpoints: {
            upvote: '/api/voting/upvote',
            downvote: '/api/voting/downvote',
            flag: '/api/voting/flag',
            summary: (itemId) => `/api/voting/${itemId}/summary`,
            flags: (itemId) => `/api/voting/${itemId}/flags`
        },
        headers: {
            'Content-Type': 'application/json'
        }
    }
};

const state = {
    currentTab: 'prototype',
    currentPage: 1,
    totalPages: 1,
    favorites: new Set(),
    tabCounts: {
        latest: 0,
        prototype: 0,
        sentient: 0,
        favorites: 0
    },
    prices: {
        'virtual-protocol': 0,
        'ethereum': 0
    },
};