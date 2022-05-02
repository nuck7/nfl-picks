import * as Router from 'koa-router';
import * as ReactDOMServer from 'react-dom/server';
import NewWeekForm from '../../src/NewWeekForm';

const router = new Router()

router.get('/', async (ctx, next) => {
  ctx.body = (
    ctx.body = ReactDOMServer.renderToStaticMarkup(
      NewWeekForm()
    )
  )

  return next()
})

router.get('/new-week-form', async (ctx, next) => {
  ctx.body = await NewWeekForm()

  return next()
})

router.allowedMethods()

const routes = router

export default routes