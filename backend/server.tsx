import * as Koa from 'koa';
import * as koaBody from 'koa-bodyparser';
import * as jwt from 'koa-jwt';
import * as logger from 'koa-logger';
import * as json from 'koa-json';
import * as serve from 'koa-static';
import routes from '../backend/routes';

const app = new Koa();
const port = 3001

app.use(json())
app.use(koaBody());
app.use(logger())

app.use(routes.routes())
app.use(serve(__dirname + '/dist'))
app.listen(port, () => {
  console.log(`listening on port ${port}`)
});