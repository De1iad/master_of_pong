import subprocess as sp

install = ["npm", 'install']
run = ["npm", "run", "start:dev"]
chmod = ['chmod', '777', './node_modules']

install_proc = sp.Popen(install)
install_proc.wait()
sp.run(chmod)
sp.run(run)
