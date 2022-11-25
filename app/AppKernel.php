<?php

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Config\Loader\LoaderInterface;

class AppKernel extends Kernel
{
    public function registerBundles()
    {
        $bundles = [
            new Symfony\Bundle\FrameworkBundle\FrameworkBundle(),
            new Symfony\Bundle\SecurityBundle\SecurityBundle(),
            new Symfony\Bundle\TwigBundle\TwigBundle(),
            new Symfony\Bundle\MonologBundle\MonologBundle(),
            new Symfony\Bundle\SwiftmailerBundle\SwiftmailerBundle(),
            new Doctrine\Bundle\DoctrineBundle\DoctrineBundle(),
            new Sensio\Bundle\FrameworkExtraBundle\SensioFrameworkExtraBundle(),
            new AppBundle\AppBundle(),
        ];

        if (in_array($this->getEnvironment(), ['dev', 'test'], true)) {
            $bundles[] = new Symfony\Bundle\DebugBundle\DebugBundle();
            $bundles[] = new Symfony\Bundle\WebProfilerBundle\WebProfilerBundle();
            $bundles[] = new Sensio\Bundle\DistributionBundle\SensioDistributionBundle();

            if ('dev' === $this->getEnvironment()) {
                $bundles[] = new Sensio\Bundle\GeneratorBundle\SensioGeneratorBundle();
                $bundles[] = new Symfony\Bundle\WebServerBundle\WebServerBundle();
            }
        }
        $this->crearCarpetasPublicas($bundles);
        $this->crearCarpetasCache();
        return $bundles;
    }

    public function getRootDir()
    {
        return __DIR__;
    }

    public function getCacheDir()
    {
        return dirname(__DIR__).'/var/cache/'.$this->getEnvironment();
    }

    public function getLogDir()
    {
        return dirname(__DIR__).'/var/logs';
    }

    public function registerContainerConfiguration(LoaderInterface $loader)
    {
        $loader->load(function (ContainerBuilder $container) {
            $container->setParameter('container.autowiring.strict_mode', true);
            $container->setParameter('container.dumper.inline_class_loader', true);

            $container->addObjectResource($this);
        });
        $loader->load($this->getRootDir().'/config/config_'.$this->getEnvironment().'.yml');
    }
    private function crearCarpetasPublicas($bundles)
    {
        /* Carpetas Publicas Assets Bundles */
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'web' . DIRECTORY_SEPARATOR . "resources" . DIRECTORY_SEPARATOR;
        if (count($bundles) > 0) {
            foreach ($bundles as $key => $bundle) {
                if (!in_array(explode("\\", get_class($bundle))[0], array('Symfony', "Sensio", "Doctrine", "Utilerias"))) {
                    $estructuraBundle = explode("\\", get_class($bundle));
                    unset($estructuraBundle[count($estructuraBundle) - 1]);
                    $directorio = $dir . join(DIRECTORY_SEPARATOR, $estructuraBundle) . DIRECTORY_SEPARATOR;
                    $carpeta = $directorio . DIRECTORY_SEPARATOR;
                    $this->crearCarpeta($carpeta . "css");
                    $this->crearCarpeta($carpeta . "js");
                }
            }
        }
    }

    private function crearCarpetasCache()
    {
        /* Carpetas temporales para el cache */
        $carpetasCache = array();

        $dir = dirname(__DIR__) . '/var/cache/';
        $carpetasCache[] = $dir . 'textos/';
        $carpetasCache[] = $dir . 'estadistica/';
        $carpetasCache[] = $dir . 'pecc/';
        $carpetasCache[] = $dir . 'web_service/';
        $carpetasCache[] = $dir . 'fp/';
        $carpetasCache[] = $dir . 'prod/';

        $dir = dirname(__DIR__) . '/web/';
        $carpetasCache[] = $dir . 'images/logos-co/';
        $carpetasCache[] = $dir . 'images/logos-co/header/';
        $carpetasCache[] = $dir . 'images/sponsor/';
        $carpetasCache[] = $dir . 'images/sponsor/ae/';
        $carpetasCache[] = $dir . 'administrador/secciones/';
        $carpetasCache[] = $dir . 'administrador/formas/';
        $carpetasCache[] = $dir . 'administrador/contratos/';
        $carpetasCache[] = $dir . 'administrador/fichas/';

        if (count($carpetasCache) > 0) {
            foreach ($carpetasCache as $key => $carpeta) {
                $this->crearCarpeta($carpeta);
            }
        }
    }

    private function crearCarpeta($carpeta)
    {
        if (!file_exists($carpeta)) {
            if (!mkdir($carpeta, 0777, true)) {
                throw new \Exception('Fallo al crear ' . $carpeta, 409);
            } else {
                chgrp($carpeta, 1002);
                chown($carpeta, 1002);
                chmod($carpeta, 0777);
            }
        }
    }
}
