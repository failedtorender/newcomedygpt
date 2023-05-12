from gunicorn.workers.ggevent import GeventWorker

bind = '0.0.0.0:5000'
workers = 1
worker_class = GeventWorker
timeout = 120

def myapp(environ, start_response):
    status = '200 OK'
    output = b'Hello World!'
    response_headers = [('Content-type', 'text/plain'),
                        ('Content-Length', str(len(output)))]
    start_response(status, response_headers)
    return [output]
