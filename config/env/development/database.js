module.exports =  ({ env }) => ({
	connection: {
		client: 'postgres',
		connection: {
		host: env('DATABASE_HOST', 'localhost'),
			port: env.int('DATABASE_PORT', 5432),
			database: env('DATABASE_NAME', 'tr-backend'),
			user: env('DATABASE_USERNAME', 'tr-backend'),
			password: env('DATABASE_PASSWORD', 'tr-backend'),
			ssl: env.bool('DATABASE_SSL', false)
		}
	}
});
