

const setLiqMnemonic = (req: Request) => {

}

const setLiqContract = (req: Request) => {
    
}

Bun.serve({
    port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8081,
    fetch(req) {
        const res = Response.json({
            message: "Hello World"
        });

        res.headers.set('Access-Control-Allow-Origin', '*');
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        return res;
    },
});
