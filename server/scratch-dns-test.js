import dns from 'dns/promises';

async function testDNS() {
    const serversList = [
        [], // Default system DNS
        ['208.67.222.222', '208.67.220.220'], // OpenDNS
        ['9.9.9.9'], // Quad9
        ['8.8.8.8', '8.8.4.4'], // Google
        ['1.1.1.1', '1.0.0.1'] // Cloudflare
    ];

    const hostname = '_mongodb._tcp.cluster0.bif1ush.mongodb.net';

    for (const servers of serversList) {
        try {
            if (servers.length > 0) {
                console.log(`Setting DNS servers to: ${servers.join(', ')}`);
                dns.setServers(servers);
            } else {
                console.log('Using default system DNS servers');
            }
            const start = Date.now();
            const records = await dns.resolveSrv(hostname);
            console.log(`SUCCESS (${Date.now() - start}ms): Found ${records.length} SRV records:`);
            console.log(records);
        } catch (error) {
            console.error(`FAILED: ${error.code || error.message}`);
        }
        console.log('---');
    }
    console.log('All DNS configurations failed.');
}

testDNS().catch(console.error);
